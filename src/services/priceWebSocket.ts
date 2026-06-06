// Real-time WebSocket price streaming service
class PriceWebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(price: number) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;

  constructor(private serverUrl: string = 'ws://localhost:3000') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Convert http to ws for production
        const wsUrl = this.serverUrl
          .replace('http://', 'ws://')
          .replace('https://', 'wss://');

        this.ws = new WebSocket(`${wsUrl}/api/prices/stream`);

        this.ws.onopen = () => {
          console.log('✅ Price WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Broadcast to all subscribers of this symbol
            if (data.symbol && data.price !== undefined) {
              const callbacks = this.subscribers.get(data.symbol);
              if (callbacks) {
                callbacks.forEach(cb => cb(data.price));
              }
            }

            // Broadcast all prices update
            if (data.prices) {
              Object.entries(data.prices).forEach(([symbol, priceData]: [string, any]) => {
                const callbacks = this.subscribers.get(symbol);
                if (callbacks) {
                  callbacks.forEach(cb => cb(priceData.price));
                }
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed, attempting reconnect...');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    }
  }

  // Subscribe to price updates for a specific symbol
  subscribe(symbol: string, callback: (price: number) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    this.subscribers.get(symbol)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(symbol);
        }
      }
    };
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

export const priceWsService = new PriceWebSocketService();
