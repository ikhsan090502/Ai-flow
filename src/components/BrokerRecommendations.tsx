import React, { useState } from 'react';
import { 
  Award, Coins, Shield, TrendingUp, Zap, Check, ExternalLink, 
  Percent, ArrowRight, Info, AlertOctagon, HelpCircle 
} from 'lucide-react';
import { motion } from 'motion/react';

interface Broker {
  id: string;
  name: string;
  badge: string;
  logoColor: string;
  rating: number;
  maxLeverage: string;
  makerFee: string;
  takerFee: string;
  fundingPeriod: string;
  pairsCount: string;
  kycRequired: string;
  specialty: string;
  pros: string[];
  signupBonus: string;
  referralLink: string;
  description: string;
}

export default function BrokerRecommendations() {
  const [selectedBroker, setSelectedBroker] = useState<string>('bitunix');
  
  // Custom calculator for capital distribution
  const [capital, setCapital] = useState<number>(100);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(10); // 10x i.e. 1000%
  const [leverageScenario, setLeverageScenario] = useState<number>(20);

  const brokers: Broker[] = [
    {
      id: 'bitunix',
      name: 'Bitunix',
      badge: 'TERBAIK UNTUK MEME PERPETUAL & TANPA KYC RIGID',
      logoColor: 'from-amber-400 to-amber-600',
      rating: 4.9,
      maxLeverage: 'Up to 125x',
      makerFee: '0.02%',
      takerFee: '0.06%',
      fundingPeriod: 'Setiap 8 Jam',
      pairsCount: '250+ Futures Pairs',
      kycRequired: 'Sangat Fleksibel / No Mandatory KYC',
      specialty: 'Listing koin mikro / meme baru super cepat dan likuiditas perpetual stabil tanpa lag.',
      pros: [
        'Tidak ada verifikasi KYC wajib yang membatasi trader ritel Indonesia.',
        'Sangat bersahabat untuk leverage tinggi pada meme koin gila seperti GNU, PEPE, WIF.',
        'Sistem trading super ringan dengan perlindungan spread kilat.'
      ],
      signupBonus: 'Welcome Bonus hingga $5,500 + Diskon Fee Rebat 20%',
      referralLink: 'https://www.bitunix.com',
      description: 'Bitunix berkembang sangat pesat sebagai "The People\'s Derivatives Exchange" dengan fokus utama mempermudah transaksi kontrak berjangka pada ribuan koin meme dan token mikro potensial.'
    },
    {
      id: 'mexc',
      name: 'MEXC Global',
      badge: 'RAJA LIQUIDITY & JUARA KOIN TERBANYAK',
      logoColor: 'from-blue-500 to-indigo-600',
      rating: 4.8,
      maxLeverage: 'Up to 200x',
      makerFee: '0.00% (Spot Maker)',
      takerFee: '0.02% (Terendah di Kelasnya)',
      fundingPeriod: 'Setiap 8 Jam',
      pairsCount: '450+ Futures Pairs',
      kycRequired: 'Butuh KYC Dasar',
      specialty: 'Tempat lahirnya koin-koin 1000x lipat sebelum rilis di bursa besar lainnya.',
      pros: [
        'Biaya Maker/Taker futures paling kompetitif di dunia (maker hampir 0%).',
        'Leverage fenomenal hingga 200x untuk pasangan koin utama seperti BTC, ETH, SOL.',
        'Likuiditas multi-miliar dolar memastikan slip minimal saat trading nominal raksasa.'
      ],
      signupBonus: 'Bonus Perdana hingga 1,000 USDT + Reward Airdrop Harian',
      referralLink: 'https://www.mexc.com',
      description: 'MEXC Global adalah legenda para pemburu token multi-bagger dengan pilihan aset crypto terlengkap dari seluruh dunia, menjadikannya pelengkap wajib deck analisis FuturesMax.'
    },
    {
      id: 'bybit',
      name: 'Bybit',
      badge: 'STABILITAS SISTEM & ENGINE PREMIUM',
      logoColor: 'from-amber-500 to-orange-600',
      rating: 4.7,
      maxLeverage: 'Up to 100x',
      makerFee: '0.02%',
      takerFee: '0.055%',
      fundingPeriod: 'Setiap 8 Jam',
      pairsCount: '300+ Pairs',
      kycRequired: 'Ya (KYC Level 1)',
      specialty: 'Copy trading inovatif terbaik dengan trader profesional bersertifikat.',
      pros: [
        'Engine pencocokan sistem super kuat yang tangguh pada market crash ekstrem.',
        'Keamanan tingkat perbankan dengan jaminan asuransi likuidasi terintegrasi.',
        'Alat charting pro dan bot otomatis bawaan (Grid & DCA).'
      ],
      signupBonus: 'Deposit Reward hingga 30,000 USDT + Voucher Potong Fee',
      referralLink: 'https://www.bybit.com',
      description: 'Bybit adalah broker kasta atas pilihan utama institusi dan trader harian profesional yang mementingkan akurasi API, charting mulus, serta efisiensi spread harga index.'
    },
    {
      id: 'binance',
      name: 'Binance',
      badge: 'BURSA NOMOR 1 GLOBAL & LIKUIDITAS MAKSIMAL',
      logoColor: 'from-yellow-400 to-yellow-600',
      rating: 4.7,
      maxLeverage: 'Up to 125x',
      makerFee: '0.02% (0.018% BNB)',
      takerFee: '0.04% (0.036% BNB)',
      fundingPeriod: 'Setiap 8 Jam / 4 Jam',
      pairsCount: '280+ Pairs',
      kycRequired: 'Wajib KYC Lengkap',
      specialty: 'Kedalaman pasar (order depth) tak tertandingi secara global.',
      pros: [
        'Diskon fee tambahan jika menggunakan koin BNB untuk margin atau potong biaya.',
        'Sistem asuransi SAFU bernilai miliaran dolar untuk kenyamanan mutlak dana Anda.',
        'Riset terlengkap di dunia serta ekosistem komprehensif.'
      ],
      signupBonus: 'Voucher Cashback Cashback Spot & Futures hingga $600',
      referralLink: 'https://www.binance.com',
      description: 'Binance memegang mahkota bursa terbesar di dunia. Sangat fantastis untuk mengeksekusi sinyal presisi tinggi dengan volume besar tanpa memengaruhi harga pasar spot.'
    }
  ];

  const currentBroker = brokers.find(b => b.id === selectedBroker) || brokers[0];

  // Calculations for capital simulation and leverage setup
  const totalPositionSize = capital * leverageScenario;
  const priceShiftRequired = (targetMultiplier * 100) / leverageScenario; // % move required for targetMultiplier (e.g., 10x / 1000% return)
  const maxLossBeforeLiq = 100 / leverageScenario; // % move inside

  return (
    <div className="space-y-6" id="broker-recommendations-deck">
      {/* Visual Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Coins className="text-emerald-400 w-32 h-32" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase mb-3">
            <Zap size={10} />
            <span>AKSELERATOR POTENSI RAINMAKER CUAN 1000%+</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-black text-white uppercase tracking-tight">
            BURSA & BROKER CRYPTO FUTURES PREMIUM
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Mengejar cuan ribuan persen membutuhkan perpaduan cerdas antara kognisi sinyal <b className="text-emerald-400">FuturesMax AI</b> dan pemilihan bursa yang memiliki fee ramah, leverage presisi, serta kemampuan melisensi token micro / meme langka seperti <b className="text-amber-400">GNUUSDT</b> secara instan.
          </p>
        </div>
      </div>

      {/* Selector Tabs and Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Broker Tabs Selection (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pl-2 mb-1">
            PILIH BURSA UTAMA ANDA:
          </div>
          <div className="flex flex-col space-y-2">
            {brokers.map((broker) => {
              const isActive = selectedBroker === broker.id;
              return (
                <button
                  key={broker.id}
                  onClick={() => setSelectedBroker(broker.id)}
                  className={`w-full text-left p-4 rounded-xl border font-mono transition relative overflow-hidden flex flex-col ${
                    isActive 
                      ? 'bg-slate-900 border-emerald-600 shadow-md text-white' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {/* Decorative glowing marker */}
                  {isActive && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
                  )}
                  
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-black uppercase tracking-wider">{broker.name}</span>
                    <span className="text-xs text-amber-400 font-bold flex items-center">
                      ★ {broker.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[240px]">
                    {broker.maxLeverage} • {broker.pairsCount}
                  </div>
                  <div className="text-[9px] mt-2 text-emerald-400 hover:underline uppercase tracking-tight flex items-center justify-end font-bold space-x-1">
                    <span>Lihat Detail</span>
                    <ArrowRight size={10} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Warning Advice */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-[10px] font-mono text-slate-500 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-amber-500 font-bold uppercase">
              <AlertOctagon size={12} />
              <span>Pemberitahuan Resiko</span>
            </div>
            <p className="leading-normal">
              Trading dengan leverage tinggi (seperti 50x - 125x) memiliki resiko likuidasi instan jika arah bertentangan. Selalu gunakan stop loss otomatis dari panel instruksi AI kami untuk memprotektifkan modal pokok Anda.
            </p>
          </div>
        </div>

        {/* Right Column: Broker Details Analysis (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          
          {/* Main Info Frame */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded bg-gradient-to-r ${currentBroker.logoColor} text-slate-950 text-[10px] font-black uppercase shadow-sm font-mono`}>
                {currentBroker.name} SPECIALTY
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded uppercase font-bold">
                {currentBroker.specialty.split(' ')[0]} PRO ENGINE
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <h3 className="text-2xl font-mono font-black text-white tracking-wide uppercase">
                {currentBroker.name}
              </h3>
              
              <a
                href={currentBroker.referralLink}
                target="_blank"
                rel="no-referrer"
                className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-md shadow-emerald-950/10"
              >
                <span>Daftar Sekarang</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 p-2.5 rounded text-[10px] sm:text-xs text-amber-400 font-mono flex items-center space-x-2">
              <Award size={14} className="animate-bounce" />
              <span><b>{currentBroker.badge}</b></span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans pt-1">
              {currentBroker.description}
            </p>
          </div>

          {/* Core Tariffs Specifications matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs">
            <div>
              <span className="text-slate-500 block">Leverage Maksimum:</span>
              <span className="text-slate-200 block font-bold mt-1 text-sm text-emerald-400">{currentBroker.maxLeverage}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Biaya Maker / Taker:</span>
              <span className="text-slate-200 block font-bold mt-1">{currentBroker.makerFee} / <span className="text-rose-455 text-rose-400">{currentBroker.takerFee}</span></span>
            </div>
            <div>
              <span className="text-slate-500 block">KYC Syarat:</span>
              <span className="text-slate-200 block font-semibold mt-1 truncate">{currentBroker.kycRequired}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Pilihan Aset Derivatif:</span>
              <span className="text-slate-200 block font-bold mt-1 text-amber-400">{currentBroker.pairsCount}</span>
            </div>
          </div>

          {/* Advantages / Mengapa Memilih Ini */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center">
              <Check className="text-emerald-400 mr-2" size={16} /> Keuntungan Utama Utama Trading di {currentBroker.name}:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {currentBroker.pros.map((pro, index) => (
                <div key={index} className="bg-slate-950/35 border border-slate-850/60 p-3 rounded-lg flex items-start space-x-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <span className="text-slate-350 text-slate-400">{pro}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sign Up Reward Banner */}
          <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="p-2 bg-emerald-950 border border-emerald-600/40 text-emerald-400 rounded-lg">
                <Percent size={16} />
              </div>
              <div>
                <span className="text-emerald-400 block font-bold">BONUS PENDAFTARAN EXCLUSIVE VIA FUTURESMAX:</span>
                <span className="text-slate-250 text-white font-medium block mt-0.5">{currentBroker.signupBonus}</span>
              </div>
            </div>
            <a
              href={currentBroker.referralLink}
              target="_blank"
              rel="no-referrer"
              className="text-[10px] w-full md:w-auto font-mono font-bold text-center px-4 py-2 bg-slate-900 border border-emerald-500/30 hover:bg-emerald-950 text-emerald-400 rounded-lg transition"
            >
              KLAIM BONUS SEKARANG
            </a>
          </div>

          {/* Smart Leverage and "Cuan Ribuan Persen" Calculator Simulation Panel */}
          <div className="border-t border-slate-800/80 pt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-amber-400" size={18} />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                SIMULATOR POSISI UNTUK CUAN MEME ROCKET (1,000% / 10X+)
              </h4>
            </div>

            <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
              Meme koin atau token low-cap seperti <b>GNUUSDT</b> atau koin presale berpotensi naik puluhan hingga ratusan persen dalam satu hari. Gunakan kalkulator ini untuk mengukur leverage di <b>Bitunix</b> atau <b>MEXC</b> untuk mendapatkan kelipatan cuan ideal Anda!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-850">
              
              {/* Capital Input field */}
              <div>
                <label className="block text-slate-400 mb-1.5">Modal Trading Awal (USDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    value={capital}
                    onChange={(e) => setCapital(Math.max(10, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:border-slate-700 transition font-bold"
                  />
                </div>
              </div>

              {/* Leverage Input Slider */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1.5">
                  <span>Skala Leverage</span>
                  <span className="text-emerald-400 font-extrabold">{leverageScenario}x</span>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="range"
                    min="5"
                    max="125"
                    step="5"
                    value={leverageScenario}
                    onChange={(e) => setLeverageScenario(parseInt(e.target.value) || 20)}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>

              {/* Target Multiplier selector */}
              <div>
                <label className="block text-slate-400 mb-1.5">Target Kelipatan Cuan</label>
                <select
                  value={targetMultiplier}
                  onChange={(e) => setTargetMultiplier(parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-slate-705 transition font-bold text-xs"
                >
                  <option value="2">Cuan 200% (2x Modal)</option>
                  <option value="5">Cuan 500% (5x Modal)</option>
                  <option value="10">Cuan 1,000% (10x Modal) ★</option>
                  <option value="20">Cuan 2,000% (20x Modal) 🔥</option>
                  <option value="50">Cuan 5,000% (50x Modal) 🚀</option>
                </select>
              </div>

            </div>

            {/* Calculations Live Displays */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                <span className="text-slate-500 block uppercase">Ukuran Margin Posisi:</span>
                <span className="text-sm text-slate-200 block font-bold mt-1">
                  ${totalPositionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Yaitu ${capital} margin x {leverageScenario}x leverage</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 border-l-[3px] border-l-emerald-500">
                <span className="text-emerald-400 block font-bold uppercase">Kenaikan Harga Dibutuhkan:</span>
                <span className="text-sm text-emerald-400 block font-black mt-1">
                  +{priceShiftRequired.toFixed(1)}% saja
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Untuk mencapai target kelipatan {targetMultiplier}x cuan</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 border-l-[3px] border-l-red-500">
                <span className="text-rose-400 block font-bold uppercase">Batas Likuidasi Margin:</span>
                <span className="text-sm text-rose-400 block font-black mt-1">
                  -{maxLossBeforeLiq.toFixed(2)}%
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Batas pergeseran harga kontra sebelum likuidasi</span>
              </div>
            </div>

          </div>

          {/* Expert Trading Tips for Low Caps */}
          <div className="border-t border-slate-800/80 pt-5 space-y-2 text-xs">
            <h5 className="font-mono font-bold text-white uppercase flex items-center space-x-1.5">
              <Info size={14} className="text-blue-400" />
              <span>Daftar Aturan Emas Berburu Koin Ratusan & Ribuan Persen</span>
            </h5>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 leading-relaxed font-sans mt-1">
              <li>
                <b>Cari Pasangan Perp Baru di Bitunix/MEXC</b>: Perhatikan tab <b className="text-amber-400">Futures</b> pada Live Feed. Di sanalah letak bursa listing tercepat token micro dan meme berkapitalisasi rendah.
              </li>
              <li>
                <b>Skala Posisi bertahap</b>: Jangan all-in modal margin Anda dalam sekali klik posisi. Pecah menjadi 3 level entri berdasarkan target range harga koin yang diberikan oleh robot kognisi Gemini.
              </li>
              <li>
                <b>Perhitungkan Pendanaan Funding Rate</b>: Untuk token meme dengan volatilitas ribuan persen, perhatikan bias investor (funding fee block) agar Anda tidak kehilangan keunggulan margin karena durasi mengapung yang terlalu lama.
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
