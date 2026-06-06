// Finnhub WebSocket Real-time Streaming

class FinnhubWebSocketClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private symbols: Set<string> = new Set();
  private priceHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Finnhub WebSocket endpoint
        this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

        this.ws.onopen = () => {
          console.log('✅ Connected to Finnhub WebSocket');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('Finnhub parse error:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Finnhub WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Finnhub WebSocket closed, attempting reconnect...');
          this.attemptReconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  subscribe(symbol: string): void {
    if (!this.symbols.has(symbol) && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbol: symbol
      }));
      this.symbols.add(symbol);
      console.log(`📊 Subscribed to ${symbol}`);
    }
  }

  unsubscribe(symbol: string): void {
    if (this.symbols.has(symbol) && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        symbol: symbol
      }));
      this.symbols.delete(symbol);
    }
  }

  onPrice(symbol: string, handler: (data: any) => void): void {
    this.priceHandlers.set(symbol, handler);
  }

  private handleMessage(data: any): void {
    // Finnhub sends { type: 'trade', data: [...] }
    if (data.type === 'trade' && data.data) {
      data.data.forEach((trade: any) => {
        const symbol = trade.s; // symbol
        const handler = this.priceHandlers.get(symbol);
        if (handler) {
          handler({
            symbol,
            price: trade.p, // last price
            bid: trade.bp, // bid price
            ask: trade.ap, // ask price
            timestamp: trade.t // timestamp
          });
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 1000 * Math.pow(2, this.reconnectAttempts);
      console.log(`⏳ Reconnecting Finnhub in ${delay}ms...`);
      setTimeout(() => {
        this.connect().catch(e => {
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

  getSubscribedSymbols(): string[] {
    return Array.from(this.symbols);
  }
}

export { FinnhubWebSocketClient };
