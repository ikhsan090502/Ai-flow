import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Health check route for uptime monitoring (e.g. UptimeRobot, Cron-Job.org)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ServerSignal {
  id: string;
  pair: string;
  type: string;
  style: string;
  entryPrice: number;
  currentPrice: number;
  takeProfit1: number;
  takeProfit2: number;
  stopLoss: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sentiment: string;
  mtfAnalysis: string;
  bullishCase: string;
  bearishCase: string;
  pipsProfit: number;
  status: 'ACTIVE' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'EXPIRED';
  timestamp: number;
  resolutionTimestamp?: number;
}

// Memory database for Signals History (Prepopulated for high-fidelity interactive stats)
let signalsHistory: ServerSignal[] = [
  {
    id: 'prep-1',
    pair: 'BTCUSDT',
    type: 'BUY',
    style: 'DAY TRADE',
    entryPrice: 91250.00,
    currentPrice: 93450.00,
    takeProfit1: 92800.00,
    takeProfit2: 94500.00,
    stopLoss: 90100.00,
    confidence: 'HIGH',
    sentiment: 'Dominansi Bullish yang kuat terlihat di area order block M15, didukung oleh peningkatan volume pembelian di atas support psikologis 90.000.',
    mtfAnalysis: 'Higher timeframe (H4) mengonfirmasi struktur bullish berkelanjutan. Lower timeframe (M15) menunjukkan Change of Character (CHoCH) ke arah atas.',
    bullishCase: 'Harga mempertahankan support MA-50, RSI menunjukkan pemulihan di atas level netral 50 tanpa pola divergensi bearish.',
    bearishCase: 'Penolakan agresif di area resistance 93.500 jika pembeli gagal mempertahankan volume perdagangan saat penutupan lilin H1.',
    pipsProfit: 2200, // For crypto, we treats difference as raw point equivalent or pips
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 48 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 44 * 3600 * 1000,
  },
  {
    id: 'prep-2',
    pair: 'XAUUSD',
    type: 'SELL',
    style: 'SCALP',
    entryPrice: 4535.50,
    currentPrice: 4515.20,
    takeProfit1: 4522.00,
    takeProfit2: 4512.00,
    stopLoss: 4545.00,
    confidence: 'HIGH',
    sentiment: 'Bearish exhaustion terdeteksi di area jenuh beli (overbought) M15, didukung momentum jual kuat dari area supply kuasi-modo.',
    mtfAnalysis: 'Lilin H1 menunjukkan pola shooting star yang presisi. timeframe M5 mengonfirmasi pergantian sirkulasi dari premium ke discount area.',
    bullishCase: 'Support statis di area 4528 bertahan kuat, memberikan peluang re-entry beli jika momentum pelemahan mereda.',
    bearishCase: 'Pola Liquidity Sweep di atas harga tertinggi kemarin selesai dengan kegagalan pembeli untuk menutup lilin di atas level 4538.',
    pipsProfit: 203, // 20.3 pips
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 36 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 35 * 3600 * 1000,
  },
  {
    id: 'prep-3',
    pair: 'EURUSD',
    type: 'BUY',
    style: 'SWING',
    entryPrice: 1.08120,
    currentPrice: 1.08520,
    takeProfit1: 1.08500,
    takeProfit2: 1.09100,
    stopLoss: 1.07750,
    confidence: 'MEDIUM',
    sentiment: 'Pembentukan pola double bottom yang valid di support minor harian. Sentimen pasar beralih optimis setelah rilis data ekonomi.',
    mtfAnalysis: 'Struktur harian didominasi momentum netral-bullish. Lilin H4 berhasil menutup di atas EMA-20.',
    bullishCase: 'Indikator Stochastic berada pada wilayah oversold dan mulai memotong ke atas (bullish crossover).',
    bearishCase: 'Jika data inflasi rilis lebih tinggi, USD berpeluang menguat dan merusak skenario pemulihan EURUSD.',
    pipsProfit: 40, // 40 pips EURUSD
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 72 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 60 * 3600 * 1000,
  },
  {
    id: 'prep-4',
    pair: 'SOLUSDT',
    type: 'BUY',
    style: 'SCALP',
    entryPrice: 175.50,
    currentPrice: 182.40,
    takeProfit1: 179.50,
    takeProfit2: 184.00,
    stopLoss: 172.00,
    confidence: 'HIGH',
    sentiment: 'Solana menunjukkan kekuatan luar biasa dengan terus mencetak level terendah baru yang lebih tinggi (Higher Low) di M15.',
    mtfAnalysis: 'breakout dari struktur segitiga simetris harian dipastikan valid dengan volume transaksi yang memadai.',
    bullishCase: 'Sentimen ekosistem DeFi Solana kian bergairah mendorong volume on-chain yang berkelanjutan.',
    bearishCase: 'Bitcoin dumping di bawah 90k akan menyeret seluruh koin utama termasuk SOL di bawah support krusial 175.',
    pipsProfit: 690,
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 24 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 22 * 3600 * 1000,
  },
  {
    id: 'prep-5',
    pair: 'GBPUSD',
    type: 'SELL',
    style: 'DAY TRADE',
    entryPrice: 1.27850,
    currentPrice: 1.27180,
    takeProfit1: 1.27400,
    takeProfit2: 1.26900,
    stopLoss: 1.28250,
    confidence: 'MEDIUM',
    sentiment: 'GBPUSD gagal merebut area resistance psikologis 1.2800 dan menunjukkan pola reversal murni.',
    mtfAnalysis: 'Struktur bearish murni terlihat pada lilin harian, momentum H4 mengalir ke bawah seiring pelemahan data pekerjaan UK.',
    bullishCase: 'Sentimen risk-on kembali di pasar ekuitas global dapat membatasi keuntungan penguatan mata uang safe haven USD.',
    bearishCase: 'EMA-50 bertindak sebagai dinamis resistance tangguh yang mengarahkan pergerakan ke target discount harian.',
    pipsProfit: 67, // +67 pips
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 20 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 17 * 3600 * 1000,
  },
  {
    id: 'prep-6',
    pair: 'XAUUSD',
    type: 'BUY',
    style: 'SCALP',
    entryPrice: 4522.00,
    currentPrice: 4515.20,
    takeProfit1: 4531.00,
    takeProfit2: 4540.00,
    stopLoss: 4516.00,
    confidence: 'MEDIUM',
    sentiment: 'Pola break of structure yang gagal di M15, likuiditas di bawah 4520 berhasil dibersihkan oleh seller instansial.',
    mtfAnalysis: 'Pullback jangka pendek menuju area fair value gap (FVG) harian yang diuji ulang.',
    bullishCase: 'RSI bangkit dari wilayah jenuh jual (oversold) di chart 15 menit dengan sinyal bullish divergence tersamar.',
    bearishCase: 'Lilin penutupan harian di bawah 4520 mengaktifkan skenario kelanjutan koreksi menuju target 4490.',
    pipsProfit: -68, // -68 pips
    status: 'STOP_LOSS',
    timestamp: Date.now() - 12 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 11 * 3600 * 1000,
  },
  {
    id: 'prep-7',
    pair: 'USDJPY',
    type: 'BUY',
    style: 'DAY TRADE',
    entryPrice: 154.90,
    currentPrice: 155.62,
    takeProfit1: 155.50,
    takeProfit2: 156.10,
    stopLoss: 154.30,
    confidence: 'HIGH',
    sentiment: 'Divergensi imbal hasil obligasi US dan Yen memicu momentum beli berkelanjutan pada USDJPY.',
    mtfAnalysis: 'Trendline H4 naik kuat tanpa adanya indikasi pembalikan harga yang kredibel saat ini.',
    bullishCase: 'Pertahanan kokoh pembeli di garis moving average harian mendukung akselerasi momentum.',
    bearishCase: 'Intervensi verbal atau aktual dari bank sentral Jepang (BoJ) adalah risiko utama kejatuhan instan USDJPY.',
    pipsProfit: 72, // +72 pips
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 15 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 10 * 3600 * 1000,
  }
];

// POST Analyze with Gemini API
app.post('/api/analyze', async (req, res) => {
  const { pair, currentPrice, timeframe, indicators, customPrompt } = req.body;

  if (!pair || !currentPrice) {
    return res.status(400).json({ error: 'Pair and currentPrice are required' });
  }

  if (!ai) {
    return res.status(500).json({ 
      error: 'Gemini API Key is not configured. Please supply GEMINI_API_KEY in Settings > Secrets.' 
    });
  }

  // Build high impact prompt
  const systemPrompt = `Kamu adalah FuturesMax AI, sebuah sistem AI analis profesional elit di pasar Crypto, Forex, Komoditas, dan Saham Indonesia (IDX).
Tugasmu adalah menganalisis pergerakan teknikal secara mendalam berdasarkan parameter input dan memberikan rekomendasi serta sinyal perdagangan (Signal Entry) yang akurat dan kredibel.

Jika aset adalah Saham Indonesia (misal: BBCA, BBRI, TLKM, GOTO, BMRI, ASII), analisislah dengan dinamika khas pasar saham domestik Indonesia (IHSG / BEI) dan pastikan memberikan harga entryPrice, takeProfit1, takeProfit2, dan stopLoss dalam bentuk angka bulat Rupiah (integer tanpa decimal sepeser pun).
Jika indikator opsional mengandung 'Momentum Pembalikan', fokuskan analisis pada penemuan pola-pola pembalikan tren (reversal momentum) seperti bullish/bearish divergence, overbought/oversold exhaustion, double bottom/top, head and shoulders, atau harmonic patterns, serta konfirmasi kegagalan breakout (liquidity sweep).

REKAYASA SINYAL:
- Tentukan jenis aksi trading: 'BUY', 'SELL', atau 'NEUTRAL'.
- Sediakan style perdagangan terpopuler: 'SCALP' (Timeframe pendek / m5-m15), 'DAY TRADE' (m30-h1), atau 'SWING' (h4-d1).
- Tentukan harga 'entryPrice' yang sangat rasional (berdekatan dengan harga sekarang yaitu ${currentPrice}).
- Berikan target 'takeProfit1' dan 'takeProfit2' serta batas pengaman 'stopLoss' yang logis sesuai kaidah risk/reward ratio sehat (minimum 1:1.5 ketat).
- Atur tingkat kepercayaan 'confidence': dapat berkisar antara 'HIGH', 'MEDIUM', atau 'LOW'.

STRUKTUR ANALISIS (Tulis semua penjelasan dalam Bahasa Indonesia yang profesional, tegas, dan berbobot tanpa istilah main-main):
- 'sentiment': Jelaskan dinamika pelaku pasar dengan detail, psikologi pembeli/penjual di area harga sekarang, dan korelasi volume transaksi.
- 'mtfAnalysis': Jelaskan analisis multi-timeframe komprehensif, menghubungkan kerangka waktu besar (HTF) dan kerangka waktu kecil (LTF).
- 'bullishCase': Argumen teknikal dan alasan utama mengapa harga berpeluang naik (misal: support kokoh, fibonacci, indikator jenuh jual, pola harmonis).
- 'bearishCase': Argumen teknikal dan alasan utama mengapa harga berpeluang turun (misal: jenuh beli, resistensi tangguh, supply zone, orderblock bearish).

PERHATIKAN HARGA YANG DIIKUTI:
Pasangan aset: ${pair}
Harga sekarang: ${currentPrice}
Waktu analisis: ${timeframe || 'M15'}
Indikator opsional bantuan: ${(indicators || []).join(', ')}
${customPrompt ? `Konteks atau catatan tambahan pengguna: ${customPrompt}` : ''}

Format balasan WAJIB berupa objek JSON valid sesuai spesifikasi schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { text: systemPrompt }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pair: { type: Type.STRING },
            type: { type: Type.STRING }, // BUY, SELL, NEUTRAL
            style: { type: Type.STRING }, // SCALP, DAY TRADE, SWING
            entryPrice: { type: Type.NUMBER },
            takeProfit1: { type: Type.NUMBER },
            takeProfit2: { type: Type.NUMBER },
            stopLoss: { type: Type.NUMBER },
            confidence: { type: Type.STRING }, // HIGH, MEDIUM, LOW
            sentiment: { type: Type.STRING },
            mtfAnalysis: { type: Type.STRING },
            bullishCase: { type: Type.STRING },
            bearishCase: { type: Type.STRING }
          },
          required: [
            'pair', 'type', 'style', 'entryPrice', 'takeProfit1', 'takeProfit2', 'stopLoss', 'confidence', 'sentiment', 'mtfAnalysis', 'bullishCase', 'bearishCase'
          ]
        }
      }
    });

    const textOutput = response.text || '{}';
    const analysisResult = JSON.parse(textOutput);

    // Inject unique server ID and generate a running record from the dynamic signal
    const isCrypto = pair.toUpperCase().includes('USDT');
    const isStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => pair.toUpperCase().startsWith(s));
    const multiplier = isStock ? 1 : (isCrypto ? 100 : (pair.toUpperCase().includes('JPY') ? 100 : 10000));
    
    // Default initial profit/pips calculated on the analysis result vs initial value (Neutral starts at 0)
    let initialPips = 0;
    if (analysisResult.type === 'BUY') {
      initialPips = Math.round((parseFloat(currentPrice) - analysisResult.entryPrice) * multiplier);
    } else if (analysisResult.type === 'SELL') {
      initialPips = Math.round((analysisResult.entryPrice - parseFloat(currentPrice)) * multiplier);
    }

    const newSignal = {
      id: 'gen-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      pair: analysisResult.pair || pair,
      type: analysisResult.type || 'NEUTRAL',
      style: analysisResult.style || 'SCALP',
      entryPrice: Number(analysisResult.entryPrice) || Number(currentPrice),
      currentPrice: Number(currentPrice),
      takeProfit1: Number(analysisResult.takeProfit1),
      takeProfit2: Number(analysisResult.takeProfit2),
      stopLoss: Number(analysisResult.stopLoss),
      confidence: (analysisResult.confidence || 'MEDIUM').toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
      sentiment: analysisResult.sentiment || 'Analisis sentimen pasar terpadu.',
      mtfAnalysis: analysisResult.mtfAnalysis || 'Analisis struktur multi-timeframe terperinci.',
      bullishCase: analysisResult.bullishCase || 'Dukungan resistensi pembeli tangguh.',
      bearishCase: analysisResult.bearishCase || 'Penekanan momentum penjual di area jenuh.',
      pipsProfit: initialPips,
      status: (analysisResult.type === 'NEUTRAL' ? 'EXPIRED' : 'ACTIVE') as any,
      timestamp: Date.now(),
    };

    // Store in historical signals list on the server so the browser dashboard picks it up!
    signalsHistory.unshift(newSignal);

    return res.json({ success: true, signal: newSignal });
  } catch (error: any) {
    console.error('Error generating analysis:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghasilkan analisis sinyal.' });
  }
});

// GET Signals History
app.get('/api/signals', (req, res) => {
  return res.json({ success: true, signals: signalsHistory });
});

// POST Reset Signals (to return to original prepopulated list)
app.post('/api/signals/reset', (req, res) => {
  signalsHistory = signalsHistory.filter(s => s.id.startsWith('prep-'));
  return res.json({ success: true, signals: signalsHistory });
});

// POST Send Telegram Notification
app.post('/api/telegram/send', async (req, res) => {
  const { botToken, chatId, signal } = req.body;

  if (!botToken || !chatId || !signal) {
    return res.status(400).json({ error: 'Telegram Bot Token, Chat ID, and Signal data are required' });
  }

  const signalTypeEmoji = signal.type === 'BUY' ? '🟢 BUY COMMAND' : (signal.type === 'SELL' ? '🔴 SELL COMMAND' : '⚪ NEUTRAL STRATEGY');
  const confidenceStars = signal.confidence === 'HIGH' ? '⭐⭐⭐ STRONGEST' : (signal.confidence === 'MEDIUM' ? '⭐⭐ NORMAL' : '⭐ CAUTIOUS');

  // Formulate high fidelity HTML message for Telegram Bot API
  const messageHtml = `
<b>🔔 FUTURESMAX AI FLOW - SIGNAL TERBARU</b>

📊 <b>Pasangan Aset:</b> <code>${signal.pair}</code>
🚀 <b>Aksi Sinyal:</b> <b>${signalTypeEmoji}</b> (${signal.style})
🔥 <b>Keyakinan (Confidence):</b> <code>${signal.confidence} (${confidenceStars})</code>

📈 <b>Harga Entry:</b> <code>${signal.entryPrice}</code>
🎯 <b>Take Profit 1:</b> <code>${signal.takeProfit1}</code>
🎯 <b>Take Profit 2:</b> <code>${signal.takeProfit2}</code>
🛑 <b>Batas Stop Loss:</b> <code>${signal.stopLoss}</code>

------------------------
💡 <b>Sentimen Pasar:</b>
<i>${signal.sentiment}</i>

🔍 <b>Analisis Struktur (MTF):</b>
<i>${signal.mtfAnalysis}</i>

🐂 <b>Bullish Skenario:</b>
<i>${signal.bullishCase}</i>

Bearish Skenario:</b>
<i>${signal.bearishCase}</i>

📱 <i>Generated on Google AI Studio Preview by FuturesMax VIP Room</i>
  `.trim();

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Gagal mengirimkan notifikasi Telegram.');
    }

    return res.json({ success: true, result });
  } catch (error: any) {
    console.error('Telegram sender API proxy error:', error);
    return res.status(500).json({ error: error.message || 'Koneksi ke bot Telegram gagal.' });
  }
});

// POST Test Telegram Integration
app.post('/api/telegram/test', async (req, res) => {
  const { botToken, chatId } = req.body;

  if (!botToken || !chatId) {
    return res.status(400).json({ error: 'Bot Token and Chat ID are required' });
  }

  const messageText = `⚡ <b>FUTURESMAX AI FLOW</b>\n\nSelamat! Integrasi bot Telegram Anda dengan FuturesMax AI Flow berhasil disinkronisasi.\nSetiap analisa sinyal real-time baru akan langsung disalurkan ke chat/channel ini.`;

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Gagal melakukan verifikasi test bot.');
    }

    return res.json({ success: true, message: 'Test connection sent successfully!' });
  } catch (error: any) {
    console.error('Telegram testing endpoint failed:', error);
    return res.status(500).json({ error: error.message || 'Kesalahan koneksi API Telegram.' });
  }
});

// Serve frontend build files in production or hook into Vite dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FuturesMax AI Flow backend initialized on port ${PORT}`);
  });
}

startServer();
