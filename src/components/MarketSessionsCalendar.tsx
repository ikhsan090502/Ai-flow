import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, AlertTriangle, Play, HelpCircle, ArrowRight, 
  Info, Sparkles, Globe, Shield, RefreshCw, Activity, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Session {
  name: string;
  city: string;
  utcOpen: number;  // Hour (0-23 UTC)
  utcClose: number; // Hour (0-23 UTC)
  impactTips: string;
  volatility: 'HIGH' | 'MEDIUM' | 'LOW';
  themeColor: string;
}

interface EconomicEvent {
  id: string;
  title: string;
  shortName: string;
  frequency: string;
  usualTime: string; // e.g., "19:30 / 20:30 WIB"
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  impactDescription: string;
  guidePrompt: string; // Analysis injection text
  currentValue?: string;
  previousValue?: string;
  forecastValue?: string;
}

interface MarketSessionsCalendarProps {
  onInjectContext?: (text: string) => void;
}

export default function MarketSessionsCalendar({ onInjectContext }: MarketSessionsCalendarProps) {
  const [selectedTimezone, setSelectedTimezone] = useState<'WIB' | 'WITA' | 'WIT'>('WIB');
  const [activeEventTab, setActiveEventTab] = useState<string>('all');
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Keep live time ticking for visual countdowns and clocks
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Timezone hours offset from UTC
  const tzOffset = {
    WIB: 7,
    WITA: 8,
    WIT: 9
  }[selectedTimezone];

  // Professional Forex / Crypto Sessions Data
  const sessions: Session[] = [
    {
      name: 'SESI ASIA (TOKYO & SYDNEY)',
      city: 'Tokyo / Sydney / Beijing',
      utcOpen: 22, // 22:00 UTC = 05:00 WIB, 06:00 WITA, 07:00 WIT
      utcClose: 9,  // 09:00 UTC = 16:00 WIB, 17:00 WITA, 18:00 WIT
      impactTips: 'Sangat kondusif untuk pergerakan pasangan mata uang AUD, JPY, NZD, serta saham domestik Indonesia (IDX) yang mulai buka pukul 09:00 WIB. Volatilitas crypto relatif linier dan memiliki kecenderungan trend steady.',
      volatility: 'MEDIUM',
      themeColor: 'emerald'
    },
    {
      name: 'SESI LONDON (EROPA)',
      city: 'London / Frankfurt / Swiss',
      utcOpen: 7,  // 07:00 UTC = 14:00 WIB, 15:00 WITA, 16:00 WIT
      utcClose: 16, // 16:00 UTC = 23:00 WIB, 00:00 WITA, 01:00 WIT
      impactTips: 'Merupakan pusat likuiditas Forex terbesar di dunia. Volatilitas melonjak tajam mulai pukul 14:00 WIB. Volatilitas tinggi terjadi pada EUR, GBP, CHF. Sering menjadi inisator arah tren harian Crypto (Bullish/Bearish).',
      volatility: 'HIGH',
      themeColor: 'blue'
    },
    {
      name: 'SESI NEW YORK (AMERIKA)',
      city: 'New York / Chicago / Toronto',
      utcOpen: 12, // 12:00 UTC = 19:00 WIB, 20:00 WITA, 21:00 WIT
      utcClose: 21, // 21:00 UTC = 04:00 WIB, 05:00 WITA, 06:00 WIT
      impactTips: 'Sesi paling agresif dan bervolume terbesar. Sangat dipengaruhi rilis data makroekonomi AS seperti NFP, CPI, Fed Rates. Cock untuk scalping agresif emas (XAUUSD), indeks pasar, BTC, dan koin meme berleverage tinggi.',
      volatility: 'HIGH',
      themeColor: 'amber'
    }
  ];

  // Core Economic events dataset (NFP, FOMC, CPI, GDP, Suku Bunga)
  const economicEvents: EconomicEvent[] = [
    {
      id: 'nfp',
      title: 'Non-Farm Payrolls (NFP)',
      shortName: 'NFP & Unemployment Rate AS',
      frequency: 'Bulanan (Jumat pertama setiap bulan)',
      usualTime: '19:30 WIB (Musim Panas) / 20:30 WIB (Musim Dingin)',
      importance: 'CRITICAL',
      impactDescription: 'Mengukur penyerapan tenaga kerja di luar sektor pertanian Amerika Serikat. Jika data rilis melebihi perkiraan, USD menguat drastis, menyebabkan Emas (XAUUSD) dan Bitcoin biasanya terkoreksi kilat dalam rilis 1-5 menit awal. Sangat rawan slippage bagi scalper.',
      guidePrompt: 'Analisis antisipasi rilis data ketenagakerjaan Non-Farm Payrolls (NFP) AS. Jelaskan skenario pergerakan likuiditas arah market (Bullish & Bearish Sweep) pada XAUUSD dan BTC untuk mempersiapkan entry scalping yang rapat.',
      currentValue: '215K',
      previousValue: '175K',
      forecastValue: '185K'
    },
    {
      id: 'fomc',
      title: 'FOMC Rate Decision & Statement',
      shortName: 'Suku Bunga & Konferensi Pers Fed',
      frequency: '8 Kali dalam Setahun (Setiap ~6 minggu)',
      usualTime: '01:00 atau 02:00 WIB dini hari',
      importance: 'CRITICAL',
      impactDescription: 'Penetapan tingkat suku bunga Federal Reserve AS. Pernyataan pers dari Ketua Jerome Powell sangat memicu likuidasi besar dua arah karena spekulasi arah suku bunga (Hawkish/Dovish) secara global untuk berbulan-bulan ke depan.',
      guidePrompt: 'Tolong buatkan trade plan dan analisis risiko volatilitas makro jelang konferensi pers FOMC Fed. Evaluasi dampak arah suku bunga tinggi/rendah terhadap pergerakan altcoin gem dan margin likuidasi koin leverage besar.',
      currentValue: '5.25%',
      previousValue: '5.25%',
      forecastValue: '5.00%'
    },
    {
      id: 'cpi',
      title: 'Consumer Price Index (CPI AS)',
      shortName: 'CPI Inflasi Konsumen AS',
      frequency: 'Bulanan (Sekitar tanggal 10 - 15)',
      usualTime: '19:30 WIB / 20:30 WIB',
      importance: 'CRITICAL',
      impactDescription: 'Induk utama pengukur inflasi AS. Jika inflasi naik lebih tinggi dibanding estimasi, the Fed harus mempertahankan suku bunga tinggi, yang biasanya mendatangkan sentimen bearish instan bagi aset berisiko tinggi (kripto dan saham).',
      guidePrompt: 'Lakukan analisis korelasi data inflasi CPI AS terbaru terhadap pergerakan BTCUSDT. Berikan estimasi resistensi kuat serta skenario support jenuh beli di timeframe rendah (M15) berdasarkan model orderblock.',
      currentValue: '3.1%',
      previousValue: '3.4%',
      forecastValue: '3.2%'
    },
    {
      id: 'gdp',
      title: 'Gross Domestic Product (GDP AS)',
      shortName: 'Pertumbuhan GDP Kuartalan AS',
      frequency: 'Kuartalan (Rilis Advanced, Preliminary, Final)',
      usualTime: '19:30 WIB / 20:30 WIB',
      importance: 'HIGH',
      impactDescription: 'Menunjukkan kesehatan ekonomi nasional AS secara agregat. GDP yang kuat mengonfirmasi tidak adanya resesi, memberi keleluasaan pada bank sentral AS untuk bertindak stabil. Pasar kripto dan forex bereaksi sejalan dengan kekuatan ekonomi.',
      guidePrompt: 'Analisis korelasi rilis angka pertumbuhan ekonomi GDP AS terhadap potensi penembusan area supply zone. Buat sinyal buy/sell yang presisi untuk swing trade.',
      currentValue: '2.5%',
      previousValue: '2.1%',
      forecastValue: '2.3%'
    },
    {
      id: 'rates_bi',
      title: 'Keputusan Suku Bunga Bank Indonesia (BI-Rate)',
      shortName: 'Rapat Dewan Gubernur BI & BI-Rate',
      frequency: 'Bulanan (Pertengahan bulan menjelang akhir)',
      usualTime: '14:20 - 15:00 WIB (Siang Hari)',
      importance: 'HIGH',
      impactDescription: 'Menentukan biaya pinjaman rupiah dan tingkat likuiditas modal di Indonesia (IHSG). Keputusan penyesuaian suku bunga ini berdampak langsung secara eksponensial terhadap valuasi saham perbankan besar kapitalisasi raksasa (BBCA, BBRI, BMRI, BBNI).',
      guidePrompt: 'Menganalisis keputusan suku bunga acuan BI-Rate terbaru dari RDG Bank Indonesia. Hubungkan efek penurunan/kenaikan bunga tersebut secara spesifik kepada proyeksi laba bersih dan area beli murah (entry zone) saham BBRI dan GOTO.',
      currentValue: '5.75%',
      previousValue: '6.00%',
      forecastValue: '5.75%'
    }
  ];

  // Helper to convert UTC hours to Local hours
  const formatUtcToLocal = (utcHour: number): string => {
    let localHour = (utcHour + tzOffset) % 24;
    if (localHour < 0) localHour += 24;
    return `${String(localHour).padStart(2, '0')}:00`;
  };

  // Helper to check if a specific UTC hour range matches current time
  const isSessionCurrentlyActive = (session: Session): boolean => {
    const day = currentTime.getDay();
    if (day === 0 || day === 6) {
      return false; // Markets closed on Saturday and Sunday
    }

    const currentUtcHour = currentTime.getUTCHours();
    const currentUtcMin = currentTime.getUTCMinutes();
    const totalCurrentUtcMinutes = currentUtcHour * 60 + currentUtcMin;

    const sessionOpenMinutes = session.utcOpen * 60;
    let sessionCloseMinutes = session.utcClose * 60;

    if (sessionOpenMinutes < sessionCloseMinutes) {
      return totalCurrentUtcMinutes >= sessionOpenMinutes && totalCurrentUtcMinutes < sessionCloseMinutes;
    } else {
      // Standard overnight session (e.g. Sydney across UTC midnight 22:00 to 07:00)
      return totalCurrentUtcMinutes >= sessionOpenMinutes || totalCurrentUtcMinutes < sessionCloseMinutes;
    }
  };

  // Helper to calculate countdown time to a session open or close
  const getSessionTimeLeft = (session: Session): { label: string; active: boolean } => {
    const day = currentTime.getDay();
    const isWeekendNow = day === 0 || day === 6;

    if (isWeekendNow) {
      return {
        label: 'TUTUP (LIBUR AKHIR PEKAN)',
        active: false
      };
    }

    const active = isSessionCurrentlyActive(session);
    const currentUtcHour = currentTime.getUTCHours();
    const currentUtcMin = currentTime.getUTCMinutes();
    const currentSec = currentTime.getUTCSeconds();
    
    let targetHour = active ? session.utcClose : session.utcOpen;
    
    let hoursDiff = targetHour - currentUtcHour;
    if (hoursDiff < 0) hoursDiff += 24;
    
    let minutesDiff = 0 - currentUtcMin;
    if (minutesDiff < 0) {
      minutesDiff += 60;
      hoursDiff = (hoursDiff - 1 + 24) % 24;
    }

    let secondsDiff = 60 - currentSec;
    if (secondsDiff === 60) {
      secondsDiff = 0;
    } else {
      minutesDiff = (minutesDiff - 1 + 60) % 60;
      if (minutesDiff === 59 && currentSec !== 0) {
        // Adjust hour overflow
      }
    }

    const countdownStr = `${String(hoursDiff).padStart(2, '0')}j ${String(minutesDiff).padStart(2, '0')}m ${String(secondsDiff).padStart(2, '0')}d`;
    return {
      label: active ? `Tutup dalam ${countdownStr}` : `Buka dalam ${countdownStr}`,
      active
    };
  };

  const handleInjectPrompt = (event: EconomicEvent) => {
    if (onInjectContext) {
      onInjectContext(event.guidePrompt);
      setInjectedSuccess(event.id);
      setTimeout(() => setInjectedSuccess(null), 3000);
    }
  };

  const filteredEvents = activeEventTab === 'all' 
    ? economicEvents 
    : economicEvents.filter(e => e.importance === activeEventTab.toUpperCase());

  return (
    <div className="space-y-6" id="market-sessions-deck">
      {/* Visual Calendar Heading Header banner */}
      <div className="bg-gradient-to-r from-teal-950/45 via-slate-900 to-slate-910 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Calendar className="text-teal-400 w-36 h-36" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-teal-950/80 border border-teal-500/20 text-teal-400 text-[10px] font-mono font-bold uppercase mb-2">
              <Globe size={11} className="animate-spin-slow" />
              <span>SINKRONISASI AKTIVITAS GLOBAL PASAR MODAL</span>
            </div>
            <h2 className="text-lg font-mono font-black text-white uppercase tracking-tight">
              SESI LIVE TRADING & KALENDER EKONOMI MAKRO
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Panduan waktu pasar terbaik, tumpang tindih sesi (overlapping), serta rilis berita kritikal yang menggerakkan volatilitas valas, kripto, dan saham IDX.
            </p>
            
            {/* Weekend Closed Status Info */}
            {(() => {
              const day = currentTime.getDay();
              const isWeekendNow = day === 0 || day === 6;
              return (
                <div className={`mt-4 p-3.5 rounded-lg border flex items-start space-x-3 font-mono text-[11px] leading-relaxed max-w-2xl ${
                  isWeekendNow 
                    ? 'bg-rose-950/40 border-rose-500/25 text-rose-350'
                    : 'bg-slate-950/45 border-slate-800 text-slate-450'
                }`}>
                  <AlertTriangle className={`shrink-0 mt-0.5 ${isWeekendNow ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} size={14} />
                  <div>
                    <span className="font-extrabold block uppercase tracking-wider text-slate-300">
                      STATUS JADWAL AKHIR PEKAN (SABTU & MINGGU)
                    </span>
                    <span className="block mt-1">
                      • <b className="text-slate-200">Pasar Forex & Saham IDX:</b> <span className={`font-black uppercase ${isWeekendNow ? 'text-rose-450 text-rose-400' : 'text-slate-400'}`}>🔐 TUTUP (CLOSED)</span> secara internasional selama akhir pekan penuh.
                    </span>
                    <span className="block">
                      • <b className="text-slate-200">Pasar Cryptocurrency:</b> <span className="text-emerald-400 font-extrabold uppercase">🔓 BUKA (AKTIF 24/7)</span> tanpa libur sepanjang tahun.
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Timezone Switcher */}
          <div className="bg-slate-950 p-1 border border-slate-800 rounded-lg flex items-center space-x-1">
            {(['WIB', 'WITA', 'WIT'] as const).map((tz) => (
              <button
                key={tz}
                onClick={() => setSelectedTimezone(tz)}
                className={`px-3 py-1 text-[10px] font-mono font-bold rounded-md transition cursor-pointer uppercase ${
                  selectedTimezone === tz 
                    ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Hours & Clocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session, index) => {
          const hoursInfo = getSessionTimeLeft(session);
          const localOpen = formatUtcToLocal(session.utcOpen);
          const localClose = formatUtcToLocal(session.utcClose);
          
          return (
            <div 
              key={session.name} 
              className={`p-5 rounded-xl border relative transition overflow-hidden ${
                hoursInfo.active 
                  ? 'bg-slate-900 border-emerald-500/30 shadow-md shadow-emerald-950/10' 
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              {/* Active Pulse Identifier */}
              {hoursInfo.active && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[8px] font-mono font-black px-2.5 py-1 tracking-widest rounded-bl-lg uppercase flex items-center space-x-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 inline-block" />
                  <span>SPl LIVE / OPEN</span>
                </div>
              )}

              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400 mb-1">
                <Clock size={14} className={hoursInfo.active ? "text-emerald-400" : "text-slate-500"} />
                <span className={hoursInfo.active ? "text-emerald-400 font-extrabold" : ""}>{session.name}</span>
              </div>
              
              <div className="text-[10px] text-slate-500 font-mono tracking-tight font-semibold">
                {session.city}
              </div>

              {/* Time displays */}
              <div className="mt-3 flex items-center justify-between text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-850/50">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">OPEN HOUR ({selectedTimezone})</span>
                  <span className="text-white text-sm font-black tracking-wide">{localOpen}</span>
                </div>
                <div className="text-slate-700 font-bold">→</div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">CLOSE HOUR ({selectedTimezone})</span>
                  <span className="text-white text-sm font-black tracking-wide">{localClose}</span>
                </div>
              </div>

              {/* Tips & Guideline */}
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed mt-4 line-clamp-3 hover:line-clamp-none transition">
                {session.impactTips}
              </p>

              {/* countdown string */}
              <div className={`mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono flex justify-between items-center ${
                hoursInfo.active ? 'text-emerald-400 font-bold' : 'text-slate-500'
              }`}>
                <span className="uppercase">STATUS DETEKTOR</span>
                <span className="font-extrabold uppercase">{hoursInfo.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sesi overlap warning tip banner */}
      <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-3.5">
        <div className="p-1 text-amber-500 mt-0.5">
          <Activity size={18} className="animate-pulse" />
        </div>
        <div className="text-xs">
          <h4 className="font-mono font-bold text-amber-400 uppercase tracking-wider">
            GOLDEN OVERLAP : SESI LONDON & NEW YORK (19:00 - 23:00 WIB)
          </h4>
          <p className="text-slate-400 leading-relaxed mt-1 font-sans">
            Waktu ini adalah "Golden Hour" perdagangan pasar global. Volume trading menyentuh klimaks tertinggi harian karena bursa Eropa dan AS beroperasi serentak. Volatilitas emas, forex utama, dan koin meme meledak ideal untuk strategi <b className="text-emerald-450 text-emerald-400">Trading Kilat (Scalping)</b>.
          </p>
        </div>
      </div>

      {/* MAIN ECONOMIC CALENDAR SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <Calendar className="text-teal-400" size={18} />
            <div>
              <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">JURNAL & KAMUS PENTING KALENDER MAKRO</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Rumus dampak rilis indikator ekonomi AS & domestik Indonesia</p>
            </div>
          </div>

          {/* Filter Importance Tab Pills */}
          <div className="flex space-x-1.5 bg-slate-950 py-1 px-1.5 rounded-lg border border-slate-850/50">
            {['all', 'critical', 'high'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveEventTab(tab)}
                className={`px-2.5 py-0.5 text-[9px] font-mono font-bold rounded-md uppercase transition cursor-pointer ${
                  activeEventTab === tab 
                    ? 'bg-slate-850 text-white' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {tab === 'all' ? 'SEMUA' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Cards Content Layout */}
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const isCritical = event.importance === 'CRITICAL';
            const isHigh = event.importance === 'HIGH';
            const isInjected = injectedSuccess === event.id;

            return (
              <div 
                key={event.id}
                className="bg-slate-950/65 border border-slate-850 rounded-xl p-4 sm:p-5 hover:border-slate-800 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white font-mono font-extrabold text-sm">{event.title}</span>
                    <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                      isCritical 
                        ? 'bg-red-950 border border-red-500/30 text-red-400' 
                        : isHigh 
                          ? 'bg-amber-950 border border-amber-500/20 text-amber-400' 
                          : 'bg-blue-950 text-blue-400'
                    }`}>
                      {event.importance} IMPACT
                    </span>
                    <span className="bg-slate-900 border border-slate-800/60 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                      {event.frequency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {event.impactDescription}
                  </p>

                  <div className="flex flex-wrap text-[10px] font-mono gap-y-1 gap-x-4 text-slate-500 pt-1">
                    <div>
                      <span className="uppercase text-slate-600">Rilis Reguler: </span>
                      <span className="text-slate-300 font-bold">{event.usualTime}</span>
                    </div>
                    {event.currentValue && (
                      <div className="flex space-x-2">
                        <span>PREV: <b className="text-slate-300">{event.previousValue}</b></span>
                        <span>FORECAST: <b className="text-amber-400">{event.forecastValue}</b></span>
                        <span>ACTUAL TERBARU: <b className="text-emerald-400">{event.currentValue}</b></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cognitive Injection Action Button column */}
                <div className="flex-shrink-0 flex items-center md:self-center">
                  <button
                    onClick={() => handleInjectPrompt(event)}
                    disabled={isInjected}
                    className={`w-full md:w-auto flex items-center justify-center space-x-1 px-4 py-2.5 rounded-lg text-xs font-mono font-bold tracking-tight transition cursor-pointer border ${
                      isInjected 
                        ? 'bg-emerald-950 border-emerald-500/30 text-emerald-400' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Sparkles className={isInjected ? 'animate-bounce text-emerald-400' : 'text-amber-400'} size={13} />
                    <span>{isInjected ? 'KOGNISI DISUNTIKKAN!' : 'Kirim Skenario Ke AI'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Learning Advice Footer */}
        <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-2 bg-slate-950 p-3 rounded-lg border border-slate-850">
          <Info size={14} className="text-blue-400" />
          <span><b>Kiat Pro FuturesMax</b>: Gunakan tombol <b className="text-slate-300">"Kirim Skenario Ke AI"</b> untuk mengoperasikan analisis kognitif Gemini sehingga model dapat mendeteksi support berisiko secara instan.</span>
        </div>
      </div>
    </div>
  );
}
