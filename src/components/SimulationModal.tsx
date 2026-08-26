import React from 'react';
import { 
  X, 
  Sliders, 
  Flame, 
  Waves, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SimulationPreset } from '../types';
import { SIMULATION_PRESETS } from '../data/argoDataset';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePresetId: string;
  onApplyPreset: (preset: SimulationPreset) => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  activePresetId,
  onApplyPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#020617]/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#020617] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ocean Event Scenario Simulator</h3>
              <p className="text-xs text-slate-400">
                Test how FloatChat AI reacts to cyclones, heatwaves & calm sea windows
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

        {/* Presets List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {SIMULATION_PRESETS.map((preset) => {
            const isSelected = preset.id === activePresetId;
            const isHigh = preset.riskLevel === 'HIGH_RISK';
            const isMod = preset.riskLevel === 'MODERATE_RISK';

            return (
              <div
                key={preset.id}
                onClick={() => {
                  onApplyPreset(preset);
                  onClose();
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-950/50 ring-1 ring-blue-500/50'
                    : 'bg-[#020617] border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isHigh ? 'bg-red-950 text-red-300 border border-red-800' : isMod ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {preset.badge}
                    </span>
                    <h4 className="font-bold text-sm text-white">{preset.title}</h4>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-mono text-blue-400 font-bold px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/80">
                      ACTIVE
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {preset.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Basin: {preset.basin}</span>
                  <div className="flex items-center gap-2">
                    {preset.tchpDelta !== 0 && (
                      <span className={preset.tchpDelta > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        TCHP: {preset.tchpDelta > 0 ? `+${preset.tchpDelta}` : preset.tchpDelta} kJ/cm²
                      </span>
                    )}
                    {preset.waveDelta !== 0 && (
                      <span className={preset.waveDelta > 0 ? 'text-rose-400 font-bold' : 'text-blue-400'}>
                        Waves: {preset.waveDelta > 0 ? `+${preset.waveDelta}m` : `${preset.waveDelta}m`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#020617] flex justify-between items-center">
          <span className="text-xs text-slate-400">Click any preset to apply scenario</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
