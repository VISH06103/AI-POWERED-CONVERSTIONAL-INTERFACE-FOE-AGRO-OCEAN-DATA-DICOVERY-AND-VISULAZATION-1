import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Volume2, 
  Flame, 
  Waves, 
  Wind, 
  Thermometer, 
  Radio, 
  MessageSquareText, 
  LineChart, 
  Info,
  ChevronRight
} from 'lucide-react';
import { ArgoFloat, CoastalPort, OceanRiskLevel } from '../types';
import { MULTILINGUAL_ADVISORIES } from '../utils/oceanPhysics';

interface RiskAlertBannerProps {
  riskLevel: OceanRiskLevel;
  nearestFloat: ArgoFloat;
  selectedPort: CoastalPort;
  language: string;
  onPlayVoice: (text: string) => void;
  onOpenDepthProfile: (float: ArgoFloat) => void;
  onOpenBroadcast: () => void;
  onAskChatbot: (question: string) => void;
}

export const RiskAlertBanner: React.FC<RiskAlertBannerProps> = ({
  riskLevel,
  nearestFloat,
  selectedPort,
  language,
  onPlayVoice,
  onOpenDepthProfile,
  onOpenBroadcast,
  onAskChatbot,
}) => {
  const localizedInfo = MULTILINGUAL_ADVISORIES[language] || MULTILINGUAL_ADVISORIES.en;
  
  let localizedAdvice = localizedInfo.lowRisk;
  if (riskLevel === 'HIGH_RISK') localizedAdvice = localizedInfo.highRisk;
  else if (riskLevel === 'MODERATE_RISK') localizedAdvice = localizedInfo.moderateRisk;

  // Visual theming based on risk
  const isHigh = riskLevel === 'HIGH_RISK';
  const isModerate = riskLevel === 'MODERATE_RISK';

  const themeClasses = isHigh
    ? {
        container: 'bg-[#0b0f19] border-red-500/60 shadow-2xl shadow-red-950/40',
        badge: 'bg-red-500 text-white font-extrabold shadow-[0_0_12px_rgba(239,68,68,0.5)]',
        title: 'text-red-400',
        icon: <ShieldAlert className="w-8 h-8 text-red-500 animate-bounce" />,
        highlight: 'text-red-400 font-bold',
        decisionBadge: 'bg-red-600 text-white font-extrabold shadow-lg shadow-red-600/30',
        decisionText: 'AVOID GOING TO SEA / RETURN TO SHORE',
        borderAccent: 'border-l-4 border-l-red-500',
      }
    : isModerate
    ? {
        container: 'bg-[#0b0f19] border-amber-500/60 shadow-2xl shadow-amber-950/30',
        badge: 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        title: 'text-amber-300',
        icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
        highlight: 'text-amber-400 font-bold',
        decisionBadge: 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/30',
        decisionText: 'CAUTION: SMALL BOATS REMAIN NEAR SHORE',
        borderAccent: 'border-l-4 border-l-amber-500',
      }
    : {
        container: 'bg-[#0b0f19] border-slate-800 shadow-2xl shadow-blue-950/20',
        badge: 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        title: 'text-emerald-300',
        icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
        highlight: 'text-emerald-400 font-bold',
        decisionBadge: 'bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-600/30',
        decisionText: 'SAFE CONDITIONS — FAVORABLE FISHING WINDOW',
        borderAccent: 'border-l-4 border-l-emerald-500',
      };

  return (
    <div id="risk-alert-banner" className={`relative rounded-2xl border p-4 sm:p-6 transition-all ${themeClasses.container} ${themeClasses.borderAccent}`}>
      
      {/* Top Banner Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        
        {/* Main Status & Decision */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            {themeClasses.icon}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full ${themeClasses.badge}`}>
                {riskLevel.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ARGO Buoy #{nearestFloat.wmoId} • {selectedPort.name} Sector
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              {themeClasses.decisionText}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onPlayVoice(localizedAdvice)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-transform active:scale-95"
            title="Listen to Voice Warning"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Voice Warning</span>
          </button>

          <button
            onClick={onOpenBroadcast}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            title="Generate Emergency SMS & VHF Radio Script"
          >
            <Radio className="w-4 h-4 text-rose-400" />
            <span>VHF / SMS</span>
          </button>

          <button
            onClick={() => onOpenDepthProfile(nearestFloat)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            title="Inspect 0-2000m Depth Profile"
          >
            <LineChart className="w-4 h-4 text-blue-400" />
            <span>CTD Profile</span>
          </button>
        </div>
      </div>

      {/* Localized Plain-Language Notice */}
      <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-900 text-blue-400 shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Fisherman Plain-Language Advisory ({localizedInfo.name})
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-100 mt-0.5 leading-snug">
              {localizedAdvice}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onAskChatbot(`Why is the sea ${riskLevel === 'HIGH_RISK' ? 'dangerous' : riskLevel === 'MODERATE_RISK' ? 'rough' : 'safe'} near ${selectedPort.name}?`)}
          className="self-end sm:self-center text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 shrink-0 bg-blue-950/50 hover:bg-blue-900/60 px-3.5 py-2 rounded-xl border border-blue-800/80 transition-colors shadow-sm"
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>Ask AI Analysis</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Oceanographic Live Parameter Barometer */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* TCHP Box */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          nearestFloat.tchp > 50 
            ? 'bg-red-950/20 border-red-500/50 shadow-lg shadow-red-950/30' 
            : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TCHP Fuel</p>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              nearestFloat.tchp > 50 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {nearestFloat.tchp > 50 ? 'CRITICAL' : 'STABLE'}
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-2xl font-light text-white">
              {nearestFloat.tchp} <span className="text-xs text-slate-400">kJ/cm²</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-400 truncate font-mono">
            {nearestFloat.tchp > 50 ? 'Cyclone threshold exceeded' : 'Normal thermal energy'}
          </p>
        </div>

        {/* D26 Isotherm Depth */}
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">D26 Isotherm</p>
            <span className="text-[9px] font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/60">
              26°C ISO
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-2xl font-light text-white">
              {nearestFloat.d26Depth} <span className="text-xs text-slate-400">meters</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-400 truncate font-mono">
            Warm pool down to {nearestFloat.d26Depth}m
          </p>
        </div>

        {/* Wave Swell */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          nearestFloat.waveHeight >= 2.5 
            ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/30' 
            : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Swell Height</p>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              nearestFloat.waveHeight >= 2.5 ? 'bg-rose-900/40 text-rose-300 border border-rose-700' : 'bg-slate-800 text-slate-400'
            }`}>
              {nearestFloat.waveHeight >= 2.5 ? 'ROUGH' : 'MODERATE'}
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-2xl font-light text-white">
              {nearestFloat.waveHeight} <span className="text-xs text-slate-400">meters</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-400 truncate font-mono">
            Wind: {nearestFloat.windSpeedKnots} knots
          </p>
        </div>

        {/* SST Sea Surface Temp */}
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Surface Temp</p>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
              {nearestFloat.sstAnomaly > 0 ? `+${nearestFloat.sstAnomaly}°C` : `${nearestFloat.sstAnomaly}°C`}
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-2xl font-light text-white">
              {nearestFloat.surfaceTemp} <span className="text-xs text-slate-400">°C</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-400 truncate font-mono">
            Salinity: {nearestFloat.surfaceSalinity} PSU
          </p>
        </div>

      </div>

    </div>
  );
};
