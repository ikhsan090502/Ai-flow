import React, { useState } from 'react';
import { TelegramConfig } from '../types';
import { Send, CheckCircle2, AlertTriangle, ShieldCheck, ToggleLeft, ToggleRight, HelpCircle } from 'lucide-react';

interface TelegramPanelProps {
  config: TelegramConfig;
  onUpdateConfig: (newConfig: TelegramConfig) => void;
}

export default function TelegramPanel({ config, onUpdateConfig }: TelegramPanelProps) {
  const [botToken, setBotToken] = useState(config.botToken);
  const [chatId, setChatId] = useState(config.chatId);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateConfig({
      botToken,
      chatId,
      enabled: config.enabled
    });
  };

  const toggleEnabled = () => {
    onUpdateConfig({
      ...config,
      enabled: !config.enabled
    });
  };

  const handleTestBot = async () => {
    if (!botToken || !chatId) {
      setTestResult({
        success: false,
        message: 'Mohon isi Bot Token dan Chat ID terlebih dahulu.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: 'Pesan tes terkirim! Periksa aplikasi Telegram Anda untuk konfirmasi penerimaan.'
        });
        
        // Auto save on successful output test
        onUpdateConfig({
          botToken,
          chatId,
          enabled: true
        });
      } else {
        throw new Error(data.error || 'Server menolak request bot.');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Koneksi API gagal. Pastikan Bot Token dan Chat ID Anda tepat.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-800/60 mb-6 gap-3">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase flex items-center">
            <Send className="text-emerald-400 mr-2" size={16} /> ADMINISTRASI TELEGRAM GATEWAY
          </h2>
          <p className="text-[10px] text-slate-500 font-mono">PUSAT BROADCAST SINYAL OTOMATIS</p>
        </div>
        
        <button
          type="button"
          onClick={toggleEnabled}
          className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg select-none transition hover:border-slate-700 cursor-pointer text-slate-400 hover:text-white"
        >
          <span className="text-xs font-mono">STATUS SINKRON:</span>
          {config.enabled ? (
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center">
              AKTIF <ToggleRight className="text-emerald-500 ml-1.5" size={20} />
            </span>
          ) : (
            <span className="text-xs font-mono font-bold text-slate-500 flex items-center">
              MATI <ToggleLeft className="text-slate-600 ml-1.5" size={20} />
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Setup Config inputs */}
        <form onSubmit={handleSave} className="lg:col-span-3 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Telegram Bot API Token</label>
            <input
              type="password"
              placeholder="CONTOH: 567490221:AAHGv4q8uY_..."
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-slate-650 transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-2">ID Obrolan Telegram (Chat ID / Group ID)</label>
            <input
              type="text"
              placeholder="CONTOH: -1002495029 atau @MyVipChannel"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-slate-655 transition font-mono"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={handleTestBot}
              disabled={isTesting}
              className="flex-1 py-2.5 bg-slate-950/45 border border-slate-800 hover:border-slate-750 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase rounded-lg transition overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
            >
              {isTesting ? 'MENGHUBUNGKAN BOT...' : 'UJI INTEGRASI BOT TELEGRAM'}
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase rounded-lg transition shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              SIMPAN
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs font-mono mt-4 ${
              testResult.success 
                ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400' 
                : 'bg-red-950/45 border-red-900/50 text-red-400'
            }`}>
              {testResult.success ? (
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span className="font-bold uppercase block mb-0.5">
                  {testResult.success ? 'SINKRON STATUS: BERHASIL' : 'SINKRON STATUS: GAGAL'}
                </span>
                {testResult.message}
              </div>
            </div>
          )}
        </form>

        {/* Clear Instructions manual Panel */}
        <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center">
            <HelpCircle className="text-emerald-400 mr-2" size={14} /> PANDUAN INTEGRASI CEPAT
          </h3>
          
          <ol className="list-decimal pl-4 text-[11px] text-slate-400 space-y-3 font-mono">
            <li>
              Hubungi <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-350">@BotFather</a> di Telegram, kirim pesan <code>/newbot</code>. Ikuti langkahnya hingga mendapat <b>Bot Token</b>.
            </li>
            <li>
              Cari bot <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-350">@userinfobot</a> atau bot sejenis untuk mendapatkan ID akun Anda. Jika ingin dikirim ke Grup/Channel, pastikan bot Anda sudah dijadikan <b>Admin</b> di grup/channel tersebut.
            </li>
            <li>
              Salin <b>Bot Token</b> dan <b>Chat ID</b> ke kolom pengaturan kiri, lalu klik <b>Save & Uji</b>.
            </li>
          </ol>

          <div className="pt-2 border-t border-slate-900 flex items-center text-[10px] text-slate-500 space-x-2">
            <ShieldCheck className="text-emerald-500" size={12} />
            <span>ENKRIPSI SSL SERVER SECURE PROXY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
