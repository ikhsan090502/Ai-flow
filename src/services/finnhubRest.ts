// Finnhub REST API - Fallback for real-time quotes
// https://finnhub.io/docs/api/quote

class FinnhubRestClient {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(symbol: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        symbol,
        price: data.c || 0, // current price
        bid: data.bp || 0, // bid price
        ask: data.ap || 0, // ask price
        high: data.h || 0,
        low: data.l || 0,
        open: data.o || 0,
        prevClose: data.pc || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Finnhub REST error for ${symbol}:`, error);
      return null;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    // Fetch sequentially to avoid rate limits
    for (const symbol of symbols) {
      const quote = await this.getQuote(symbol);
      if (quote) {
        results[symbol] = quote;
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}

export { FinnhubRestClient };
