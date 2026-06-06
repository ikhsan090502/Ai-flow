// Massive.com API Integration
// Smart batching untuk 5 calls/minute limit

interface MassivePrice {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  change24h?: number;
  timestamp: number;
}

class MassiveApiService {
  private apiKey: string;
  private baseUrl = 'https://api.massive.com/rest';
  private callCount = 0;
  private callResetTime = Date.now();

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    // Reset call counter every minute
    setInterval(() => {
      this.callCount = 0;
      this.callResetTime = Date.now();
    }, 60000);
  }

  // Check rate limit
  private canCall(): boolean {
    const timePassed = Date.now() - this.callResetTime;
    if (timePassed > 60000) {
      this.callCount = 0;
      this.callResetTime = Date.now();
    }
    return this.callCount < 5;
  }

  // Smart batch fetching - respect 5 calls/minute
  async fetchMultiplePrices(symbols: string[]): Promise<MassivePrice[]> {
    if (!this.canCall()) {
      console.warn('⚠️ Rate limit reached, waiting for next minute');
      return [];
    }

    try {
      this.callCount++;

      const querySymbols = symbols.join(',');
      const response = await fetch(
        `${this.baseUrl}/quote?symbols=${querySymbols}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Massive API error: ${response.statusText}`);
      }

      const data = await response.json();
      const prices: MassivePrice[] = [];

      // Parse Massive API response
      if (data.data) {
        Object.entries(data.data).forEach(([symbol, quote]: [string, any]) => {
          prices.push({
            symbol,
            price: parseFloat(quote.last) || parseFloat(quote.close) || 0,
            bid: parseFloat(quote.bid),
            ask: parseFloat(quote.ask),
            change24h: parseFloat(quote.change24h),
            timestamp: Date.now()
          });
        });
      }

      console.log(`✅ Massive: Fetched ${prices.length} prices (Call ${this.callCount}/5)`);
      return prices;
    } catch (error) {
      console.error('Massive API fetch error:', error);
      return [];
    }
  }

  // Batch strategy: Priority assets first, then rotate
  async smartBatchFetch(allSymbols: string[]): Promise<MassivePrice[]> {
    if (!this.canCall()) {
      return [];
    }

    // Priority: XAUUSD + hot crypto first
    const prioritySymbols = ['XAUUSD', 'BTC', 'ETH', 'SOL'];
    const remainingSymbols = allSymbols.filter(s => !prioritySymbols.includes(s));

    const results = await this.fetchMultiplePrices([
      ...prioritySymbols.slice(0, 5)
    ]);

    return results;
  }

  getRemainingCalls(): number {
    return Math.max(0, 5 - this.callCount);
  }
}

export { MassiveApiService };
export type { MassivePrice };
