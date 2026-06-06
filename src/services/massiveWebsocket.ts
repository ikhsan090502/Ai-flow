// Massive.com WebSocket Streaming
// Real-time price updates via Massive WebSocket

class MassiveWebSocketClient {
  private ws: WebSocket | null = null;
  private accessKeyId: string;
  private secretKey: string;
  private symbols: string[] = [];
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(accessKeyId: string, secretKey: string) {
    this.accessKeyId = accessKeyId;
    this.secretKey = secretKey;
  }

  connect(symbols: string[]): Promise<void> {
    this.symbols = symbols;

    return new Promise((resolve, reject) => {
      try {
        // Massive WebSocket endpoint - determine from docs
        const wsUrl = 'wss://ws.massive.com'; // May need adjustment based on docs

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to Massive WebSocket');
          this.reconnectAttempts = 0;
          
          // Authenticate
          this.send({
            type: 'auth',
            key: this.accessKeyId,
            secret: this.secretKey
          });

          // Subscribe to symbols
          symbols.forEach(symbol => {
            this.subscribe(symbol);
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('Parse error:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Massive WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Massive WebSocket closed, attempting reconnect...');
          this.attemptReconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(symbol: string): void {
    this.send({
      type: 'subscribe',
      symbols: [symbol]
    });
    console.log(`📊 Subscribed to ${symbol}`);
  }

  onPrice(symbol: string, handler: (data: any) => void): void {
    this.messageHandlers.set(symbol, handler);
  }

  private handleMessage(data: any): void {
    // Parse Massive WebSocket message format
    if (data.type === 'tick' || data.type === 'aggregate') {
      const symbol = data.symbol;
      const handler = this.messageHandlers.get(symbol);
      if (handler) {
        handler(data);
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 1000 * Math.pow(2, this.reconnectAttempts);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => {
        this.connect(this.symbols).catch(e => {
          console.error('Reconnection failed:', e);
        });
      }, delay);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export { MassiveWebSocketClient };
