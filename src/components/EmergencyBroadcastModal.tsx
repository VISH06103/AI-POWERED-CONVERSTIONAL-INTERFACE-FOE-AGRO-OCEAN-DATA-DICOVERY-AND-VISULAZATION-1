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
  Send,
  UserCheck,
  WifiOff,
  Navigation
} from 'lucide-react';
import { ArgoFloat, CoastalPort, MobileSensorReading, OceanRiskLevel, UserProfile, VillageConditionResult } from '../types';
import { generateEmergencySMS, generateRegisteredCaptainRadioPacket, generateVhfRadioScript, playMarineRadioDistressAudio } from '../utils/oceanPhysics';

interface EmergencyBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPort: CoastalPort;
  nearestFloat: ArgoFloat;
  riskLevel: OceanRiskLevel;
  currentUser?: UserProfile | null;
  activeVillageResult?: VillageConditionResult | null;
  sensorReading?: MobileSensorReading;
  isInternetJammed?: boolean;
}

export const EmergencyBroadcastModal: React.FC<EmergencyBroadcastModalProps> = ({
  isOpen,
  onClose,
  selectedPort,
  nearestFloat,
  riskLevel,
  currentUser,
  activeVillageResult,
  sensorReading,
  isInternetJammed = false,
}) => {
  const [activeTab, setActiveTab] = useState<'registered' | 'sms' | 'vhf' | 'navtex' | 'contacts'>('registered');
  const [copied, setCopied] = useState<string | null>(null);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);
  const [audioStopFn, setAudioStopFn] = useState<(() => void) | null>(null);

  if (!isOpen) return null;

  const villageName = activeVillageResult?.villageName || currentUser?.villageOrPort || selectedPort.name;
  const stateName = activeVillageResult?.state || currentUser?.state || selectedPort.state;

  const defaultSensor: MobileSensorReading = sensorReading || {
    isSensorSupported: true,
    isSensorActive: true,
    sensorSource: 'SIMULATED',
    isInternetJammed,
    signalStrengthPercent: isInternetJammed ? 0 : 85,
    compassHeading: 115,
    pitchAngle: 2,
    rollAngle: 4,
    isCapsizingRisk: false,
    heaveAcceleration: 0.8,
    waveChopIntensity: 'Moderate Swell (0.5-1.2G)',
    barometricPressureHpa: 1008,
    barometricPressureTrend: 'Steady (Stable Sea)',
    gpsSpeedKnots: 8.5,
    gpsHeading: 115,
    gpsAccuracyMeters: 8,
    timestamp: new Date().toLocaleTimeString(),
  };

  const registeredPacket = generateRegisteredCaptainRadioPacket(
    currentUser || null,
    nearestFloat,
    villageName,
    stateName,
    defaultSensor,
    riskLevel,
    isInternetJammed ? 'SIGNAL_JAMMED' : 'DEADZONE_AUTO_TRIGGER'
  );

  const smsText = generateEmergencySMS(villageName, riskLevel, nearestFloat.tchp, nearestFloat.waveHeight);
  const vhfScript = registeredPacket.spokenVhfScript;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  const handlePlayAudio = (textToSpeak: string) => {
    if (isPlayingRadio && audioStopFn) {
      audioStopFn();
      setIsPlayingRadio(false);
      setAudioStopFn(null);
      return;
    }

    const stop = playMarineRadioDistressAudio(
      textToSpeak,
      () => setIsPlayingRadio(true),
      () => {
        setIsPlayingRadio(false);
        setAudioStopFn(null);
      }
    );
    setAudioStopFn(() => stop);
  };

  const navtexBullet = `ZCZC WA99\n${new Date().toISOString().slice(0, 10).replace(/-/g, '')} UTC\n${selectedPort.basin.toUpperCase()} COASTAL WARNING NR 412\n${villageName.toUpperCase()} SECTOR.\nREGISTERED MASTER: ${registeredPacket.captainName.toUpperCase()} (${registeredPacket.boatName.toUpperCase()})\nARGO PROFILE BUOY ${nearestFloat.wmoId} INDICATES CYCLONIC HEAT BUILDUP TCHP ${nearestFloat.tchp} KJ/CM2.\nWAVE SWELLS ${nearestFloat.waveHeight} METERS, GUSTS ${nearestFloat.windSpeedKnots} KTS.\nALL CRAFTS ADVISE EXTREME CAUTION / RETURN TO PORT.\nNNNN`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#020617]/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#020617] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-900/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Emergency Radio & Broadcast Transponder</h3>
              <p className="text-xs text-slate-400">
                Registered Vessel Auto-Radio Relay, VHF Ch 16, DSC & 160-Char SMS
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (audioStopFn) audioStopFn();
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
            onClick={() => setActiveTab('registered')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'registered' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Registered Captain VHF (Auto-Radio)</span>
          </button>
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
            <span>Coastal Securite Notice</span>
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
          
          {/* 1. Registered Captain Auto-Radio Tab */}
          {activeTab === 'registered' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-300">
                  <span>Registered Vessel: <strong className="text-white">{registeredPacket.boatName}</strong> ({registeredPacket.boatRegNumber})</span>
                  <span className="mx-2 text-slate-600">•</span>
                  <span>Master: <strong className="text-emerald-400">{registeredPacket.captainName}</strong> ({registeredPacket.phone})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayAudio(registeredPacket.spokenVhfScript)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all ${
                      isPlayingRadio 
                        ? 'bg-rose-600 text-white animate-pulse' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isPlayingRadio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isPlayingRadio ? 'Halt Radio Broadcast' : 'Broadcast VHF Voice'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed whitespace-pre-wrap">
                {registeredPacket.spokenVhfScript}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleCopy('regVhf', registeredPacket.spokenVhfScript)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  {copied === 'regVhf' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied === 'regVhf' ? 'Copied to Clipboard!' : 'Copy Registered VHF Script'}</span>
                </button>

                <button
                  onClick={() => handleCopy('dscTelegram', registeredPacket.dscAlertFormat)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  {copied === 'dscTelegram' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>Copy DSC / AIS Telegram</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. 160-Char SMS Tab */}
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

          {/* 3. VHF Radio Tab */}
          {activeTab === 'vhf' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Coastal Securite Marine Notice</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                    SECURITE SAFETY CALL
                  </span>
                </div>

                <button
                  onClick={() => handlePlayAudio(generateVhfRadioScript(villageName, riskLevel, nearestFloat.wmoId, nearestFloat.tchp, nearestFloat.waveHeight))}
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
                {generateVhfRadioScript(villageName, riskLevel, nearestFloat.wmoId, nearestFloat.tchp, nearestFloat.waveHeight)}
              </div>

              <button
                onClick={() => handleCopy('vhf', generateVhfRadioScript(villageName, riskLevel, nearestFloat.wmoId, nearestFloat.tchp, nearestFloat.waveHeight))}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copied === 'vhf' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied === 'vhf' ? 'VHF Script Copied!' : 'Copy VHF Radio Script'}</span>
              </button>
            </div>
          )}

          {/* 4. NAVTEX Tab */}
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

          {/* 5. Coast Guard Directory Tab */}
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
              if (audioStopFn) audioStopFn();
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
