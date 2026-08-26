import React, { useState } from 'react';
import { 
  Compass, 
  Waves, 
  Activity, 
  Radio, 
  AlertTriangle, 
  Gauge, 
  Navigation, 
  Sliders, 
  Volume2, 
  ShieldAlert, 
  ShieldCheck, 
  Maximize2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  WifiOff,
  Signal,
  Wind
} from 'lucide-react';
import { MobileSensorReading, LocationTrackInfo } from '../types';

interface MobileSensorTelemetryHUDProps {
  sensorReading: MobileSensorReading;
  isInternetJammed: boolean;
  onToggleJammer: () => void;
  targetTrack?: LocationTrackInfo;
  onPlayVoice?: (text: string) => void;
  hasHardwareSensors?: boolean;
  onRequestSensorAccess?: () => void;
  onUpdateSimulatedRoll?: (roll: number) => void;
  onUpdateSimulatedPitch?: (pitch: number) => void;
  onUpdateSimulatedHeading?: (heading: number) => void;
  onUpdateSimulatedBaro?: (baro: number) => void;
}

export const MobileSensorTelemetryHUD: React.FC<MobileSensorTelemetryHUDProps> = ({
  sensorReading,
  isInternetJammed,
  onToggleJammer,
  targetTrack,
  onPlayVoice,
  hasHardwareSensors = false,
  onRequestSensorAccess,
  onUpdateSimulatedRoll,
  onUpdateSimulatedPitch,
  onUpdateSimulatedHeading,
  onUpdateSimulatedBaro,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(false);

  const {
    rollAngle,
    pitchAngle,
    compassHeading,
    heaveAcceleration,
    waveChopIntensity,
    barometricPressureHpa,
    barometricPressureTrend,
    gpsSpeedKnots,
    gpsAccuracyMeters,
    isCapsizingRisk,
    sensorSource,
  } = sensorReading;

  // Heading difference to target bearing
  const targetBearing = targetTrack?.bearingDegrees ?? 120;
  const headingDiff = ((compassHeading - targetBearing + 180 + 360) % 360) - 180;
  const offCourseText = Math.abs(headingDiff) < 5 
    ? 'ON COURSE' 
    : headingDiff > 0 
    ? `Steer PORT ${Math.abs(headingDiff)}°` 
    : `Steer STBD ${Math.abs(headingDiff)}°`;

  const handleVoiceReadout = () => {
    if (!onPlayVoice) return;
    const text = isCapsizingRisk
      ? `CAPSIZING WARNING! Vessel roll is ${Math.abs(rollAngle)} degrees to ${rollAngle > 0 ? 'starboard' : 'port'}. Reduce speed and steer into the wave swell.`
      : `Sensor Telemetry Report: Heading ${compassHeading} degrees at ${gpsSpeedKnots} knots. Roll is ${Math.abs(rollAngle)} degrees. Wave chop is ${waveChopIntensity}. Barometric pressure ${barometricPressureHpa} hectopascals, ${barometricPressureTrend}.`;
    onPlayVoice(text);
  };

  return (
    <div className={`rounded-3xl border transition-all duration-300 shadow-2xl backdrop-blur-xl overflow-hidden ${
      isCapsizingRisk 
        ? 'bg-red-950/90 border-red-600 ring-4 ring-red-500/50 animate-pulse' 
        : isInternetJammed 
        ? 'bg-[#0b0f19] border-amber-500/80 shadow-amber-950/40' 
        : 'bg-[#0b0f19] border-slate-800'
    }`}>
      
      {/* HUD Header Bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
            isCapsizingRisk 
              ? 'bg-red-600 border-red-400 text-white animate-bounce' 
              : isInternetJammed 
              ? 'bg-amber-600/20 border-amber-500/40 text-amber-400' 
              : 'bg-blue-600/20 border-blue-500/30 text-blue-400'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>Mobile Vessel Sensor Telemetry HUD</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  sensorSource === 'HARDWARE' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}>
                  {sensorSource === 'HARDWARE' ? 'Phone Hardware Gyro' : 'Real-Time Dynamic Telemetry'}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Attitude, Compass, Heave Shock & Atmospheric Barometer</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-emerald-400">{sensorReading.gpsSpeedKnots} kts</span>
            </p>
          </div>
        </div>

        {/* Jammer & Sensor Actions */}
        <div className="flex items-center gap-2">
          {/* Signal Jammer Test Toggle */}
          <button
            onClick={onToggleJammer}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isInternetJammed
                ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-900/40'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Simulate complete satellite & internet outage at sea"
          >
            {isInternetJammed ? <WifiOff className="w-3.5 h-3.5" /> : <Signal className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isInternetJammed ? 'Internet Jammed (Offline Mode)' : 'Online Satellite'}</span>
          </button>

          {/* Voice Readout Button */}
          {onPlayVoice && (
            <button
              onClick={handleVoiceReadout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
              title="Voice Telemetry Announcement"
            >
              <Volume2 className="w-4 h-4 text-blue-400" />
            </button>
          )}

          {/* Calibrate / Hardware Request */}
          {onRequestSensorAccess && (
            <button
              onClick={onRequestSensorAccess}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 transition-colors"
              title="Activate Phone Orientation Sensor"
            >
              Calibrate Gyro
            </button>
          )}

          {/* Toggle Simulator Controls */}
          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
              showControls ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
            title="Sensor Tuning Sliders"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Capsizing Warning Banner */}
      {isCapsizingRisk && (
        <div className="p-3 bg-red-600 text-white flex items-center justify-between px-5 font-bold text-xs sm:text-sm animate-pulse">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
            <span>
              🚨 CRITICAL CAPSIZING RISK: Vessel List Angle {Math.abs(rollAngle)}° ({rollAngle > 0 ? 'Starboard' : 'Port'}). Limit turns & steer perpendicular to wave swells!
            </span>
          </div>
          <span className="font-mono text-xs uppercase bg-black/30 px-2 py-0.5 rounded">
            Tilt &gt; 22° Danger
          </span>
        </div>
      )}

      {/* Main Expanded HUD Dashboard */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5">
          
          {/* Top 4 Telemetry Gauges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* 1. Vessel Attitude (Pitch & Roll Horizon) */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  <span>Attitude Horizon</span>
                </span>
                <span className={`font-mono font-bold ${Math.abs(rollAngle) > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {rollAngle > 0 ? `STBD ${rollAngle}°` : rollAngle < 0 ? `PORT ${Math.abs(rollAngle)}°` : '0° LEVEL'}
                </span>
              </div>

              {/* Graphic Attitude Horizon Visualizer */}
              <div className="my-3 relative h-20 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                {/* Horizon Line tilted by Roll */}
                <div 
                  className="absolute w-36 h-[2px] bg-cyan-400/80 transition-transform duration-200 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  style={{ transform: `rotate(${rollAngle}deg) translateY(${pitchAngle * 1.5}px)` }}
                />
                
                {/* Vessel Silhouette */}
                <div 
                  className="relative z-10 transition-transform duration-200"
                  style={{ transform: `rotate(${rollAngle}deg)` }}
                >
                  <svg className="w-10 h-10 text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 16L6 20H18L20 16L12 14L4 16Z" />
                    <rect x="11" y="7" width="2" height="7" fill="white" />
                    <polygon points="12,4 12,9 16,9" fill="#38bdf8" />
                  </svg>
                </div>

                {/* Pitch Level Indicators */}
                <div className="absolute left-2 text-[9px] font-mono text-slate-500 flex flex-col justify-between h-14">
                  <span>+15°</span>
                  <span>0°</span>
                  <span>-15°</span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>Pitch: <strong className="text-white">{pitchAngle}° ({pitchAngle >= 0 ? 'Bow Up' : 'Bow Down'})</strong></span>
                <span>Roll: <strong className={isCapsizingRisk ? 'text-red-400' : 'text-white'}>{rollAngle}°</strong></span>
              </div>
            </div>

            {/* 2. Nautical Compass & Track Steering */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gyro Compass</span>
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {compassHeading}°
                </span>
              </div>

              {/* Compass Dial Indicator */}
              <div className="my-2 flex items-center justify-center">
                <div className="relative w-20 h-20 rounded-full border-2 border-slate-700 bg-slate-950 flex items-center justify-center shadow-inner">
                  {/* Rotating Compass Disc */}
                  <div 
                    className="absolute w-full h-full rounded-full transition-transform duration-300 flex items-center justify-center"
                    style={{ transform: `rotate(${-compassHeading}deg)` }}
                  >
                    <span className="absolute top-1 font-mono text-[9px] font-bold text-red-500">N</span>
                    <span className="absolute bottom-1 font-mono text-[9px] font-bold text-slate-400">S</span>
                    <span className="absolute right-1 font-mono text-[9px] font-bold text-slate-400">E</span>
                    <span className="absolute left-1 font-mono text-[9px] font-bold text-slate-400">W</span>
                  </div>
                  
                  {/* Fixed Bow Pointer Needle */}
                  <div className="w-1.5 h-10 bg-gradient-to-t from-transparent via-red-500 to-red-500 rounded-full z-10"></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Target Vector:</span>
                  <span className="text-amber-300 font-bold">{targetBearing}°</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Course Steer:</span>
                  <span className={`font-bold ${Math.abs(headingDiff) < 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {offCourseText}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Wave Chop & Dynamic Shock Meter */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-blue-400" />
                  <span>Wave Heave & Shock</span>
                </span>
                <span className="font-mono text-blue-300 font-bold">
                  {heaveAcceleration} m/s²
                </span>
              </div>

              <div className="my-3 space-y-2">
                {/* Vertical Shock Bar */}
                <div className="h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      heaveAcceleration > 2.0 
                        ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' 
                        : heaveAcceleration > 1.2 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (heaveAcceleration / 2.5) * 100)}%` }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                    {waveChopIntensity}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>GPS Speed: <strong className="text-white">{gpsSpeedKnots} kts</strong></span>
                <span>Accuracy: <strong className="text-white">±{gpsAccuracyMeters}m</strong></span>
              </div>
            </div>

            {/* 4. On-Device Atmospheric Barometer */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-amber-400" />
                  <span>Atmospheric Pressure</span>
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {barometricPressureHpa} hPa
                </span>
              </div>

              <div className="my-3 text-center space-y-1.5">
                <div className="text-xl font-mono font-black text-white">
                  {barometricPressureHpa} <span className="text-xs font-normal text-slate-400">mbar</span>
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                  barometricPressureHpa < 1000 
                    ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse' 
                    : barometricPressureHpa < 1008 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {barometricPressureTrend}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center font-mono">
                {barometricPressureHpa < 1005 ? '⚠️ Rapid pressure drop: Squall approaching' : '✓ Normal barometric pressure'}
              </div>
            </div>

          </div>

          {/* Interactive Simulator Sliders Drawer (when toggled) */}
          {showControls && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Vessel Gyro & Sensor Tuning Sliders (Test Bench)</span>
                </h4>
                <span className="text-[10px] text-slate-400">Adjust to test capsizing alert & steering</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                {/* Roll Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Vessel Roll (Tilt):</span>
                    <span className="font-bold text-amber-300">{rollAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-35"
                    max="35"
                    value={rollAngle}
                    onChange={(e) => onUpdateSimulatedRoll && onUpdateSimulatedRoll(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>-35° Port</span>
                    <span>0° Level</span>
                    <span>+35° Stbd</span>
                  </div>
                </div>

                {/* Pitch Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Vessel Pitch:</span>
                    <span className="font-bold text-cyan-300">{pitchAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={pitchAngle}
                    onChange={(e) => onUpdateSimulatedPitch && onUpdateSimulatedPitch(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>-20° Down</span>
                    <span>0°</span>
                    <span>+20° Up</span>
                  </div>
                </div>

                {/* Compass Heading Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Compass Heading:</span>
                    <span className="font-bold text-emerald-300">{compassHeading}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="359"
                    value={compassHeading}
                    onChange={(e) => onUpdateSimulatedHeading && onUpdateSimulatedHeading(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>0° N</span>
                    <span>180° S</span>
                    <span>359° N</span>
                  </div>
                </div>

                {/* Barometer Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Air Pressure:</span>
                    <span className="font-bold text-purple-300">{barometricPressureHpa} hPa</span>
                  </div>
                  <input
                    type="range"
                    min="980"
                    max="1025"
                    value={barometricPressureHpa}
                    onChange={(e) => onUpdateSimulatedBaro && onUpdateSimulatedBaro(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>980 Cyclone</span>
                    <span>1013 Normal</span>
                    <span>1025 High</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
