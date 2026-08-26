import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  LifeBuoy, 
  Compass, 
  Anchor, 
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import { ArgoFloat, CoastalPort } from '../types';

interface OfflineCacheManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  cachedFloats: ArgoFloat[];
  cachedPorts: CoastalPort[];
  lastSyncTime: string;
  onRefreshCache: () => void;
}

export const OfflineCacheManager: React.FC<OfflineCacheManagerProps> = ({
  isOpen,
  onClose,
  isOffline,
  onToggleOffline,
  cachedFloats,
  cachedPorts,
  lastSyncTime,
  onRefreshCache,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'survival'>('status');

  if (!isOpen) return null;

  const handleSyncNow = () => {
    setSyncing(true);
    setTimeout(() => {
      onRefreshCache();
      setSyncing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#020617]/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#020617] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Offline Cache & Sea Survival Manager</h3>
              <p className="text-xs text-slate-400">
                Guaranteed Ocean Risk Prediction at Sea Without Internet Connectivity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-[#020617]/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'status' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Storage Cache</span>
          </button>
          <button
            onClick={() => setActiveTab('survival')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'survival' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Offline Sea Survival Guide</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {activeTab === 'status' && (
            <div className="space-y-4">
              
              {/* Sea Mode Status Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isOffline ? 'bg-amber-950/30 border-amber-800' : 'bg-emerald-950/30 border-emerald-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isOffline ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                    {isOffline ? <WifiOff className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {isOffline ? 'Offline Sea Mode Active' : 'Live Satellite Network Connected'}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {isOffline 
                        ? 'Simulating deep ocean disconnected state. FloatChat is using cached ARGO profiles & local ML rules.' 
                        : 'Streaming telemetry directly from ARGO oceanographic data centers.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onToggleOffline}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95 ${
                    isOffline 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {isOffline ? 'Go Live' : 'Test Offline'}
                </button>
              </div>

              {/* Cache Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Cached ARGO Floats</span>
                  <div className="text-xl font-mono font-bold text-blue-400 mt-1">{cachedFloats.length}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Coastal Harbors</span>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{cachedPorts.length}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Cache Size</span>
                  <div className="text-xl font-mono font-bold text-purple-400 mt-1">128 KB</div>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300">Last Synced Timestamp:</span>
                  <p className="font-mono text-xs text-blue-400">{lastSyncTime}</p>
                </div>

                <button
                  onClick={handleSyncNow}
                  disabled={syncing || isOffline}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync Fresh Ocean Data'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Before leaving the fishing harbor, press "Sync Fresh Ocean Data" to store the latest 10-day ARGO CTD profiles and coastal danger zones onto your phone or laptop.
              </p>
            </div>
          )}

          {activeTab === 'survival' && (
            <div className="space-y-3 text-xs text-slate-300">
              
              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 space-y-1.5">
                <span className="font-bold text-red-400 flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  1. Cyclone Maneuvering (Right-Hand Semicircle Rule)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  In the Northern Hemisphere (Bay of Bengal, Arabian Sea, South China Sea), the dangerous semicircle is to the right of the storm track. Put the wind on your starboard (right) bow and steam away with maximum safe speed.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 space-y-1.5">
                <span className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                  <Anchor className="w-4 h-4" />
                  2. Rough Sea Anchor (Drogue) Deployment
                </span>
                <p className="text-slate-300 leading-relaxed">
                  If engine fails in high swells (&gt;3m), immediately deploy your sea anchor or weighted trailing nets from the bow to keep the boat facing head-on into the waves, preventing roll capsizing.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 space-y-1.5">
                <span className="font-bold text-blue-400 flex items-center gap-1.5 text-sm">
                  <LifeBuoy className="w-4 h-4" />
                  3. VHF Distress Call Protocol (MAYDAY)
                </span>
                <p className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  "MAYDAY MAYDAY MAYDAY. THIS IS [VESSEL NAME]. POSITION [LAT/LONG]. SINKING / CAPSIZED IN HEAVY SWELLS. [NUMBER] PERSONS ON BOARD. REQUIRING IMMEDIATE ASSISTANCE. OVER."
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#020617] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close Cache Manager
          </button>
        </div>

      </div>
    </div>
  );
};
