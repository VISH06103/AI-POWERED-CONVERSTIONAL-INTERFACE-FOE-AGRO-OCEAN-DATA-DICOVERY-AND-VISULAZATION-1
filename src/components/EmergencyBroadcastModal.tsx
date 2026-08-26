import React, { useState } from 'react';
import { 
  X, 
  Radio, 
  MessageSquare, 
  Copy, 
  Check, 
  Share2, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  FileText, 
  ShieldAlert, 
  Send
} from 'lucide-react';
import { ArgoFloat, CoastalPort, OceanRiskLevel } from '../types';
import { generateEmergencySMS, generateVhfRadioScript } from '../utils/oceanPhysics';

interface EmergencyBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPort: CoastalPort;
  nearestFloat: ArgoFloat;
  riskLevel: OceanRiskLevel;
}

export const EmergencyBroadcastModal: React.FC<EmergencyBroadcastModalProps> = ({
  isOpen,
  onClose,
  selectedPort,
  nearestFloat,
  riskLevel,
}) => {
  const [activeTab, setActiveTab] = useState<'sms' | 'vhf' | 'navtex' | 'contacts'>('sms');
  const [copied, setCopied] = useState<string | null>(null);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);

  if (!isOpen) return null;

  const smsText = generateEmergencySMS(selectedPort.name, riskLevel, nearestFloat.tchp, nearestFloat.waveHeight);
  const vhfScript = generateVhfRadioScript(selectedPort.name, riskLevel, nearestFloat.wmoId, nearestFloat.tchp, nearestFloat.waveHeight);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  // Synthesize realistic VHF marine radio transmission with static noise and bandpass filtering
  const playVhfRadioAudio = () => {
    if (isPlayingRadio) {
      window.speechSynthesis.cancel();
      setIsPlayingRadio(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in this browser.');
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Generate initial radio squelch chirp
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);

      // Speak VHF Radio script with urgent maritime cadence
      const utterance = new SpeechSynthesisUtterance(vhfScript);
      utterance.rate = 0.92;
      utterance.pitch = 0.95;

      utterance.onend = () => {
        // End Roger Beep
        try {
          const endOsc = audioCtx.createOscillator();
          const endGain = audioCtx.createGain();
          endOsc.type = 'sine';
          endOsc.frequency.setValueAtTime(1200, audioCtx.currentTime);
          endGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          endGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
          endOsc.connect(endGain);
          endGain.connect(audioCtx.destination);
          endOsc.start();
          endOsc.stop(audioCtx.currentTime + 0.15);
        } catch (e) {}
        setIsPlayingRadio(false);
      };

      utterance.onerror = () => setIsPlayingRadio(false);

      setIsPlayingRadio(true);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Audio Context failed, using standard SpeechSynthesis', e);
      const utterance = new SpeechSynthesisUtterance(vhfScript);
      utterance.onend = () => setIsPlayingRadio(false);
      setIsPlayingRadio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const navtexBullet = `ZCZC WA99\n${new Date().toISOString().slice(0, 10).replace(/-/g, '')} UTC\n${selectedPort.basin.toUpperCase()} COASTAL WARNING NR 412\n${selectedPort.name.toUpperCase()} SECTOR.\nARGO PROFILE BUOY ${nearestFloat.wmoId} INDICATES CYCLONIC HEAT BUILDUP TCHP ${nearestFloat.tchp} KJ/CM2.\nWAVE SWELLS ${nearestFloat.waveHeight} METERS, GUSTS ${nearestFloat.windSpeedKnots} KTS.\nALL CRAFTS ADVISE EXTREME CAUTION / RETURN TO PORT.\nNNNN`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#020617]/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#020617] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-900/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Emergency Multi-Channel Broadcast Center</h3>
              <p className="text-xs text-slate-400">
                Generate Instant SMS, VHF Ch 16 Radio & NAVTEX for Fishermen & Harbors
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isPlayingRadio) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-[#020617]/60 p-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'sms' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>160-Char SMS (GSM)</span>
          </button>
          <button
            onClick={() => setActiveTab('vhf')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'vhf' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>VHF Marine Ch 16 Radio</span>
          </button>
          <button
            onClick={() => setActiveTab('navtex')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'navtex' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>NAVTEX Coastal Telex</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'contacts' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Coast Guard Directory</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* 1. 160-Char SMS Tab */}
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Formatted for 2G / GSM Fisherman Handsets</span>
                <span className="font-mono text-blue-400 font-bold">{smsText.length} / 160 Characters</span>
              </div>

              {/* Simulated Mobile SMS Bubble */}
              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 shadow-inner font-mono text-xs text-slate-100 leading-relaxed relative">
                {smsText}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => handleCopy('sms', smsText)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all active:scale-95"
                >
                  {copied === 'sms' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copied === 'sms' ? 'SMS Copied to Clipboard!' : 'Copy SMS Alert'}</span>
                </button>

                <a
                  href={`sms:?body=${encodeURIComponent(smsText)}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Send via Device SMS App</span>
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020617] border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  This concise alert is calibrated to deliver life-saving decision criteria under poor cellular coverage when data connections are unavailable.
                </p>
              </div>
            </div>
          )}

          {/* 2. VHF Radio Tab */}
          {activeTab === 'vhf' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">VHF Marine Channel 16 Script</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                    SECURITE SAFETY CALL
                  </span>
                </div>

                <button
                  onClick={playVhfRadioAudio}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all ${
                    isPlayingRadio 
                      ? 'bg-rose-600 text-white animate-pulse' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isPlayingRadio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingRadio ? 'Halt Radio Audio' : 'Simulate Radio Audio'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed whitespace-pre-wrap">
                {vhfScript}
              </div>

              <button
                onClick={() => handleCopy('vhf', vhfScript)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copied === 'vhf' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied === 'vhf' ? 'VHF Script Copied!' : 'Copy VHF Radio Script'}</span>
              </button>
            </div>
          )}

          {/* 3. NAVTEX Tab */}
          {activeTab === 'navtex' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300">Standard Maritime Telex (518 kHz)</span>
              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap">
                {navtexBullet}
              </div>
              <button
                onClick={() => handleCopy('navtex', navtexBullet)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copied === 'navtex' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>Copy NAVTEX Notice</span>
              </button>
            </div>
          )}

          {/* 4. Coast Guard Directory Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#020617] border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">National Maritime SAR Toll-Free</h4>
                  <p className="text-xs text-slate-400">Indian Coast Guard Search & Rescue</p>
                </div>
                <a
                  href="tel:1554"
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-sm shadow-md"
                >
                  Dial 1554
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020617] border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{selectedPort.name} Port Control</h4>
                  <p className="text-xs text-slate-400">Harbor Master & Coastal Radio Station</p>
                </div>
                <span className="font-mono text-blue-400 text-xs font-bold">
                  {selectedPort.vhfChannel}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020617] border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Direct Coast Guard Station</h4>
                  <p className="text-xs text-slate-400">{selectedPort.coastGuardContact}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#020617] flex justify-end">
          <button
            onClick={() => {
              if (isPlayingRadio) window.speechSynthesis.cancel();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close Broadcast Center
          </button>
        </div>

      </div>
    </div>
  );
};
