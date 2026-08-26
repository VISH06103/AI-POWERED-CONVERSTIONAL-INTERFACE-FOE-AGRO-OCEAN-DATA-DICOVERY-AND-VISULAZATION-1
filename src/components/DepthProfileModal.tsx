import React, { useState } from 'react';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Layers, 
  Flame, 
  HelpCircle, 
  Activity, 
  ArrowDown, 
  TrendingDown,
  Info
} from 'lucide-react';
import { ArgoFloat } from '../types';

interface DepthProfileModalProps {
  float: ArgoFloat | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DepthProfileModal: React.FC<DepthProfileModalProps> = ({
  float,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'temperature' | 'salinity' | 'table'>('temperature');

  if (!isOpen || !float) return null;

  const points = float.profilePoints;
  const maxDepth = 2000;
  const d26 = float.d26Depth;

  // Compute SVG chart coordinates
  const svgWidth = 500;
  const svgHeight = 400;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  // Temperature domain: 0°C to 35°C
  const minTemp = 0;
  const maxTemp = 35;
  const getXTemp = (temp: number) => padding.left + ((temp - minTemp) / (maxTemp - minTemp)) * chartW;
  
  // Salinity domain: 30 PSU to 37 PSU
  const minSal = 30;
  const maxSal = 38;
  const getXSal = (sal: number) => padding.left + ((sal - minSal) / (maxSal - minSal)) * chartW;

  // Depth domain: 0 to 2000m (using log-style or split linear scale for better upper 300m visibility)
  // Let's use a scale that gives 60% of height to the top 300m where thermocline lives
  const getYDepth = (depth: number) => {
    if (depth <= 300) {
      return padding.top + (depth / 300) * (chartH * 0.65);
    } else {
      return padding.top + chartH * 0.65 + ((depth - 300) / 1700) * (chartH * 0.35);
    }
  };

  // Generate SVG path for temperature
  const tempPathData = points.reduce((acc, p, idx) => {
    const x = getXTemp(p.temp);
    const y = getYDepth(p.depth);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Generate SVG path for salinity
  const salPathData = points.reduce((acc, p, idx) => {
    const x = getXSal(p.salinity);
    const y = getYDepth(p.depth);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // D26 Line Y position
  const d26Y = getYDepth(d26);
  const d26X = getXTemp(26.0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#020617]/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0b0f19] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#020617]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">ARGO CTD Ocean Depth Profile</h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/80">
                  Buoy #{float.wmoId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                0m to 2000m Vertical CTD Sensor Measurements • {float.basin}
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#020617] border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">SST Surface Temp</span>
              <div className="text-xl font-mono font-black text-amber-400">{float.surfaceTemp}°C</div>
              <span className="text-[10px] text-slate-500">At 0m depth</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#020617] border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">D26 Isotherm</span>
              <div className="text-xl font-mono font-black text-blue-400">{float.d26Depth}m</div>
              <span className="text-[10px] text-slate-500">26°C warmth depth</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#020617] border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">TCHP Energy</span>
              <div className="text-xl font-mono font-black text-red-400">{float.tchp} kJ/cm²</div>
              <span className="text-[10px] text-slate-500">{float.tchp > 50 ? 'Cyclone danger threshold' : 'Stable'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#020617] border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Mixed Layer (MLD)</span>
              <div className="text-xl font-mono font-black text-purple-400">{float.mld}m</div>
              <span className="text-[10px] text-slate-500">Uniform top layer</span>
            </div>
          </div>

          {/* View Tab Buttons */}
          <div className="flex border-b border-slate-800 pb-2 gap-2">
            <button
              onClick={() => setActiveTab('temperature')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'temperature' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperature & D26 Isotherm (°C)</span>
            </button>
            <button
              onClick={() => setActiveTab('salinity')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'salinity' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Salinity Halocline (PSU)</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Raw ARGO Profile Table</span>
            </button>
          </div>

          {/* Graphical Display */}
          {activeTab === 'temperature' && (
            <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Vertical Temperature Profile & Warm Heat Reservoir (0m to 2000m)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  D26 Threshold: 26.0°C at {float.d26Depth}m
                </span>
              </div>

              <div className="w-full overflow-x-auto flex justify-center">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[500px] h-auto text-slate-400">
                  {/* Grid Lines for Depth */}
                  {[0, 50, 100, 200, 300, 500, 1000, 2000].map(d => {
                    const y = getYDepth(d);
                    return (
                      <g key={d}>
                        <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                        <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b" className="font-mono">
                          {d}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Grid Lines for Temp */}
                  {[5, 10, 15, 20, 25, 26, 30].map(t => {
                    const x = getXTemp(t);
                    return (
                      <g key={t}>
                        <line x1={x} y1={padding.top} x2={x} y2={svgHeight - padding.bottom} stroke={t === 26 ? '#f59e0b44' : '#1e293b'} strokeDasharray={t === 26 ? '4,4' : '2,2'} />
                        <text x={x} y={svgHeight - padding.bottom + 15} textAnchor="middle" fontSize="10" fill={t === 26 ? '#f59e0b' : '#64748b'} className="font-mono font-bold">
                          {t}°C
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Tropical Cyclone Heat Potential Zone (Between 0m and D26 where T >= 26C) */}
                  {d26 > 0 && (
                    <rect
                      x={getXTemp(26.0)}
                      y={getYDepth(0)}
                      width={getXTemp(float.surfaceTemp) - getXTemp(26.0)}
                      height={d26Y - getYDepth(0)}
                      fill="#ef4444"
                      fillOpacity="0.18"
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* D26 Isotherm Marker Line */}
                  {d26 > 0 && (
                    <g>
                      <line x1={padding.left} y1={d26Y} x2={svgWidth - padding.right} y2={d26Y} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                      <text x={svgWidth - padding.right} y={d26Y - 6} textAnchor="end" fontSize="10" fill="#ef4444" className="font-mono font-bold">
                        D26 Depth: {d26}m
                      </text>
                    </g>
                  )}

                  {/* Temperature Curve Line */}
                  <path d={tempPathData} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />

                  {/* Data Points */}
                  {points.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={getXTemp(p.temp)}
                      cy={getYDepth(p.depth)}
                      r={p.depth === 0 || p.depth === d26 ? 4.5 : 2.5}
                      fill={p.temp >= 26 ? '#ef4444' : '#38bdf8'}
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              </div>

              {/* Chart Explanation */}
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Fisherman Safety Insight:</strong> The red shaded area represents the <em>warm ocean fuel pool</em>. Because warm water (&gt;26°C) reaches all the way down to <strong>{d26} meters</strong>, large waves will not easily churn up cold bottom water to cool a storm. This causes cyclones to intensify rapidly overnight.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'salinity' && (
            <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  Vertical Salinity Halocline Profile (30 to 38 PSU)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Surface Salinity: {float.surfaceSalinity} PSU
                </span>
              </div>

              <div className="w-full overflow-x-auto flex justify-center">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[500px] h-auto text-slate-400">
                  {/* Grid Lines for Depth */}
                  {[0, 50, 100, 200, 300, 500, 1000, 2000].map(d => {
                    const y = getYDepth(d);
                    return (
                      <g key={d}>
                        <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                        <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b" className="font-mono">
                          {d}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Grid Lines for Salinity */}
                  {[30, 32, 34, 35, 36, 38].map(s => {
                    const x = getXSal(s);
                    return (
                      <g key={s}>
                        <line x1={x} y1={padding.top} x2={x} y2={svgHeight - padding.bottom} stroke="#1e293b" strokeDasharray="2,2" />
                        <text x={x} y={svgHeight - padding.bottom + 15} textAnchor="middle" fontSize="10" fill="#64748b" className="font-mono">
                          {s} PSU
                        </text>
                      </g>
                    );
                  })}

                  {/* Salinity Curve Line */}
                  <path d={salPathData} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />

                  {/* Data Points */}
                  {points.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={getXSal(p.salinity)}
                      cy={getYDepth(p.depth)}
                      r={3}
                      fill="#a855f7"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              </div>

              <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <Droplets className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Salinity Barrier Layer:</strong> Fresh river runoff or heavy monsoon rain creates a low-salinity layer at the surface that acts like a blanket, trapping heat below and preventing vertical cooling.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'table' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-[#020617] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Depth (m)</th>
                    <th className="p-3">Temp (°C)</th>
                    <th className="p-3">Salinity (PSU)</th>
                    <th className="p-3">Pressure (dbar)</th>
                    <th className="p-3">Density (kg/m³)</th>
                    <th className="p-3">Sound Speed (m/s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {points.map((pt, i) => (
                    <tr key={i} className={`hover:bg-slate-800/60 ${pt.depth === d26 ? 'bg-red-950/40 text-red-200 font-bold' : ''}`}>
                      <td className="p-3">{pt.depth}m</td>
                      <td className={`p-3 ${pt.temp >= 26 ? 'text-amber-400' : 'text-cyan-400'}`}>{pt.temp}</td>
                      <td className="p-3">{pt.salinity}</td>
                      <td className="p-3 text-slate-400">{pt.pressure}</td>
                      <td className="p-3 text-slate-400">{pt.density}</td>
                      <td className="p-3 text-slate-400">{pt.soundSpeed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Educational Fisherman FAQ Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#020617] border border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>How ARGO Floats Help Save Fishermen Lives</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-blue-300 block mb-1">What is an ARGO Buoy?</span>
                An ARGO float is an autonomous robotic cylinder that dives 2,000 meters into the abyss and rises every 10 days, taking precise ocean temperature & salinity profiles before beaming the data to satellites.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-1">Why Surface Temperature is Not Enough:</span>
                Satellites only see the skin of the water. If only the top 5 meters are warm, a storm blows cold water up and dies out. But if the warm water goes 80 meters deep (high TCHP), the storm explodes in violence. FloatChat warns you before it happens.
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#020617] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
