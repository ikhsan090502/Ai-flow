// Finnhub Webhook Handler - Real-time price push (BEST SOLUTION!)
// No polling needed, no rate limits!

// Add this route to server.ts

app.post('/api/finnhub/webhook', (req, res) => {
  try {
    // Verify webhook signature
    const secret = process.env.FINNHUB_WEBHOOK_SECRET || 'd8iaumhr01qm63bb2ql0';
    const headerSecret = req.headers['x-finnhub-secret'];

    if (headerSecret !== secret) {
      console.warn('⚠️ Webhook signature mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ACKNOWLEDGE IMMEDIATELY (Finnhub requirement)
    res.status(200).json({ status: 'received' });

    // Process webhook data asynchronously
    const data = req.body;

    if (data.type === 'trade') {
      // Real-time trade data from Finnhub
      const trades = data.data || [];
      trades.forEach((trade: any) => {
        const symbol = trade.s; // symbol
        const price = trade.p; // price
        const bid = trade.bp; // bid
        const ask = trade.ap; // ask

        if (symbol && price) {
          setServerCachedPrice(symbol, price, 0);
          console.log(`✅ Finnhub WEBHOOK: ${symbol} = ${price}`);

          // Broadcast to all WebSocket clients immediately
          broadcastPriceUpdate(symbol, {
            price,
            bid,
            ask,
            timestamp: Date.now()
          });
        }
      });
    } else if (data.type === 'quote') {
      // Real-time quote data
      const quote = data.data;
      if (quote && quote.s) {
        const symbol = quote.s;
        const price = quote.p || quote.ltp;

        if (price) {
          setServerCachedPrice(symbol, price, 0);
          console.log(`✅ Finnhub WEBHOOK QUOTE: ${symbol} = ${price}`);

          broadcastPriceUpdate(symbol, {
            price,
            bid: quote.bp,
            ask: quote.ap,
            timestamp: Date.now()
          });
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Function to broadcast price update via WebSocket
function broadcastPriceUpdate(symbol: string, data: any) {
  const message = JSON.stringify({
    type: 'update',
    symbol,
    ...data,
    timestamp: Date.now()
  });

  connectedClients.forEach((client: any) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
      } catch (error) {
        console.error('Error broadcasting:', error);
      }
    }
  });
}
