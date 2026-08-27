import React from 'react';
import { 
  Waves, 
  Wifi, 
  WifiOff, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Languages, 
  Sliders, 
  Radio, 
  Database,
  Compass,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { CoastalPort, ArgoFloat, UserProfile } from '../types';
import { MULTILINGUAL_ADVISORIES } from '../utils/oceanPhysics';

interface HeaderProps {
  isOffline: boolean;
  onToggleOffline: () => void;
  selectedPort: CoastalPort;
  onSelectPort: (port: CoastalPort) => void;
  allPorts: CoastalPort[];
  currentLanguage: string;
  onChangeLanguage: (lang: string) => void;
  isVoiceMuted: boolean;
  onToggleVoice: () => void;
  onOpenSimulation: () => void;
  onOpenOfflineManager: () => void;
  onOpenBroadcast: () => void;
  onLocateUser: () => void;
  isLocating: boolean;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOffline,
  onToggleOffline,
  selectedPort,
  onSelectPort,
  allPorts,
  currentLanguage,
  onChangeLanguage,
  isVoiceMuted,
  onToggleVoice,
  onOpenSimulation,
  onOpenOfflineManager,
  onOpenBroadcast,
  onLocateUser,
  isLocating,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="bg-[#020617]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Left Branding & Port Selector */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-900/30 text-white">
              <Waves className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isOffline ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center">
                  FloatChat<span className="text-blue-500 text-xs align-top ml-1 font-mono font-bold tracking-normal bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/80">AI</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                ARGO Ocean Intelligence & Fishermen Safety System
              </p>
            </div>
          </div>

          {/* Quick Mobile User / Offline Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onOpenLogin}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 text-xs"
              title="User Profile"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleOffline}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isOffline 
                  ? 'bg-amber-950/70 border-amber-600 text-amber-300' 
                  : 'bg-slate-800/80 border-slate-700 text-emerald-400'
              }`}
              title="Toggle Offline Sea Mode"
            >
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center: Port & Location Picker */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-blue-400">
              <Compass className="w-4 h-4" />
            </div>
            <select
              value={selectedPort.id}
              onChange={(e) => {
                const port = allPorts.find(p => p.id === e.target.value);
                if (port) onSelectPort(port);
              }}
              className="w-full pl-8 pr-8 py-2 text-xs sm:text-sm font-medium bg-slate-900/90 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer shadow-inner"
            >
              {allPorts.map((port) => (
                <option key={port.id} value={port.id}>
                  ⚓ {port.name} ({port.basin})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onLocateUser}
            disabled={isLocating}
            className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Detect GPS & nearest port"
          >
            <MapPin className={`w-3.5 h-3.5 text-blue-400 ${isLocating ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'GPS'}</span>
          </button>
        </div>

        {/* Right Controls & Utilities */}
        <div className="flex items-center gap-2 justify-between md:justify-end">
          
          {/* User Profile Button & Logout */}
          <div className="hidden lg:flex items-center gap-1.5">
            {currentUser ? (
              <>
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors"
                  title="Edit profile & village"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-white block text-[11px] leading-tight truncate max-w-[110px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono">
                      {currentUser.villageOrPort.split(' (')[0]}
                    </span>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 text-xs transition-colors"
                  title="Logout / Switch Captain"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Offline/Online Sea Mode Badge */}
          <button
            onClick={onToggleOffline}
            className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
              isOffline 
                ? 'bg-amber-950/80 border-amber-600 text-amber-300 shadow-md shadow-amber-900/30' 
                : 'bg-slate-800/50 border-slate-700 text-slate-300'
            }`}
            title="Toggle Offline Sea Mode (Test cache and local inference at sea)"
          >
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></div>
            <span className="text-xs font-medium uppercase tracking-wider">
              {isOffline ? 'Sea Mode (Offline)' : 'Satellite Link Active'}
            </span>
          </button>

          {/* Language Selector */}
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
            >
              {Object.entries(MULTILINGUAL_ADVISORIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.name}
                </option>
              ))}
            </select>
            <Languages className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Voice Audio Readout Toggle */}
          <button
            onClick={onToggleVoice}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              !isVoiceMuted 
                ? 'bg-blue-950/80 border-blue-600 text-blue-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={isVoiceMuted ? 'Turn On Voice Audio Warnings' : 'Mute Voice Audio Warnings'}
          >
            {!isVoiceMuted ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline">{!isVoiceMuted ? 'Voice' : 'Muted'}</span>
          </button>

          {/* Emergency VHF & SMS Broadcast Button */}
          <button
            onClick={onOpenBroadcast}
            className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            title="Emergency SMS & VHF Radio Broadcast"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline">VHF/SMS</span>
          </button>

          {/* Offline Cache & Simulation Tools */}
          <button
            onClick={onOpenOfflineManager}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-colors"
            title="Offline Cache & Survival Guide"
          >
            <Database className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>

          <button
            onClick={onOpenSimulation}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-colors"
            title="Test Cyclone / Swell Ocean Simulations"
          >
            <Sliders className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>

      </div>
    </header>
  );
};

