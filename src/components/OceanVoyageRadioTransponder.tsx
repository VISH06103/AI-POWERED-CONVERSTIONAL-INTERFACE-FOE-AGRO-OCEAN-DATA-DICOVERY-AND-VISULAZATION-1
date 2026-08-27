import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  WifiOff, 
  Signal, 
  Navigation, 
  ShieldAlert, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Send, 
  Compass, 
  Waves, 
  Activity, 
  UserCheck, 
  Anchor, 
  Clock, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Sliders,
  MessageSquare,
  Share2,
  TowerControl,
  PhoneForwarded,
  CheckCircle2
} from 'lucide-react';
import { ArgoFloat, CoastalPort, MobileSensorReading, OceanRiskLevel, RegisteredRadioPacket, UserProfile, VillageConditionResult, VoyageNavigationState } from '../types';
import { 
  calculateBearing, 
  calculateDistanceKm, 
  generateRegisteredCaptainRadioPacket, 
  generateRegisteredCaptainSMS, 
  getCoastalRadioStation, 
  playMarineRadioDistressAudio 
} from '../utils/oceanPhysics';

interface OceanVoyageRadioTransponderProps {
  currentUser: UserProfile | null;
  selectedPort?: CoastalPort;
  nearestFloat: ArgoFloat;
  riskLevel: OceanRiskLevel;
  activeVillageResult?: VillageConditionResult | null;
  sensorReading: MobileSensorReading;
  isInternetJammed: boolean;
  onToggleJammer: () => void;
  onOpenBroadcastModal?: () => void;
  onUpdateVoyageState?: (state: VoyageNavigationState) => void;
}

export const OceanVoyageRadioTransponder: React.FC<OceanVoyageRadioTransponderProps> = ({
  currentUser,
  selectedPort = {
    id: 'port-kasimedu',
    name: 'Kasimedu (Chennai Fishing Harbor)',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 13.1250,
    lng: 80.2980,
    nearestFloatId: 'float-2902086',
    localLanguage: 'ta',
    districtCoastGuard: '+91-44-23460405 / 1554'
  },
  nearestFloat,
  riskLevel,
  activeVillageResult,
  sensorReading,
  isInternetJammed,
  onToggleJammer,
  onOpenBroadcastModal,
  onUpdateVoyageState,
}) => {
  const originLat = activeVillageResult?.lat || selectedPort.lat;
  const originLng = activeVillageResult?.lng || selectedPort.lng;
  const villageName = activeVillageResult?.villageName || currentUser?.villageOrPort || selectedPort.name;
  const stateName = activeVillageResult?.state || currentUser?.state || selectedPort.state;

  // Voyage Navigation Simulation State
  const [isVoyageActive, setIsVoyageActive] = useState<boolean>(true);
  const [distanceOffshoreNm, setDistanceOffshoreNm] = useState<number>(14.5);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPlayingRadioAudio, setIsPlayingRadioAudio] = useState<boolean>(false);
  const [audioStopFn, setAudioStopFn] = useState<(() => void) | null>(null);
  const [lastAutoDistressTime, setLastAutoDistressTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sms' | 'radiostation' | 'transponder' | 'script' | 'dsc' | 'registry'>('sms');
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState<'DELIVERED_TO_GSM' | 'TRANSMITTING' | 'QUEUED'>('DELIVERED_TO_GSM');
  const [lastSmsSentTime, setLastSmsSentTime] = useState<string>(new Date().toLocaleTimeString());

  // Compute simulated ship coordinates based on distance offshore heading towards the float
  const targetBearing = calculateBearing(originLat, originLng, nearestFloat.lat, nearestFloat.lng);
  const distKm = distanceOffshoreNm * 1.852;
  const latOffset = (distKm / 111) * Math.cos((targetBearing * Math.PI) / 180);
  const lngOffset = (distKm / (111 * Math.cos((originLat * Math.PI) / 180))) * Math.sin((targetBearing * Math.PI) / 180);
  
  const shipLat = Number((originLat + latOffset).toFixed(4));
  const shipLng = Number((originLng + lngOffset).toFixed(4));

  // Auto-detect connection state based on distance or jammer
  const isDeepSeaDeadzone = isInternetJammed || distanceOffshoreNm >= 20;
  const connectionState: 'CELLULAR_4G' | 'SATELLITE_LINK' | 'SIGNAL_JAMMED_DEADZONE' = 
    isInternetJammed || distanceOffshoreNm >= 25 
      ? 'SIGNAL_JAMMED_DEADZONE' 
      : distanceOffshoreNm >= 12 
      ? 'SATELLITE_LINK' 
      : 'CELLULAR_4G';

  // Regional Coastal Marine Radio Station
  const coastalStation = getCoastalRadioStation(stateName || villageName);

  // Generate the live registered radio packet & SMS
  const triggerReason = isDeepSeaDeadzone ? 'SIGNAL_JAMMED' : riskLevel === 'HIGH_RISK' ? 'HIGH_SWELL' : 'DEADZONE_AUTO_TRIGGER';
  
  const radioPacket: RegisteredRadioPacket = generateRegisteredCaptainRadioPacket(
    currentUser,
    nearestFloat,
    villageName,
    stateName,
    sensorReading,
    riskLevel,
    triggerReason,
    { lat: shipLat, lng: shipLng, offshoreNm: distanceOffshoreNm }
  );

  const captainSMS = generateRegisteredCaptainSMS(
    currentUser,
    nearestFloat,
    villageName,
    stateName,
    riskLevel,
    { lat: shipLat, lng: shipLng, offshoreNm: distanceOffshoreNm },
    isDeepSeaDeadzone
  );

  // Sync with parent for map rendering
  useEffect(() => {
    if (onUpdateVoyageState) {
      onUpdateVoyageState({
        isVoyageActive,
        distanceTravelledNm: distanceOffshoreNm,
        currentOffshoreNm: distanceOffshoreNm,
        departurePoint: {
          name: villageName,
          lat: originLat,
          lng: originLng,
          state: stateName,
        },
        currentPosition: {
          lat: shipLat,
          lng: shipLng,
        },
        bearingDegrees: targetBearing,
        speedKnots: sensorReading.gpsSpeedKnots || 8.5,
        connectionState,
        autoDistressSent: isDeepSeaDeadzone,
        activeRadioPacket: isDeepSeaDeadzone ? radioPacket : null,
      });
    }
  }, [isVoyageActive, distanceOffshoreNm, isDeepSeaDeadzone, shipLat, shipLng, targetBearing, villageName, originLat, originLng, stateName, connectionState]);

  // When signal jams, auto-trigger the radio broadcast log & SMS queue
  useEffect(() => {
    if (isDeepSeaDeadzone && !lastAutoDistressTime) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutoDistressTime(now);
      setLastSmsSentTime(now);
      setSmsDeliveryStatus('TRANSMITTING');
      setTimeout(() => {
        setSmsDeliveryStatus('DELIVERED_TO_GSM');
      }, 1500);
    } else if (!isDeepSeaDeadzone) {
      setLastAutoDistressTime(null);
    }
  }, [isDeepSeaDeadzone, lastAutoDistressTime]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleShareSms = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FLOATCHAT Distress Alert - ${captainSMS.boatName}`,
          text: captainSMS.smsText,
        });
      } catch {
        handleCopy('sms', captainSMS.smsText);
      }
    } else {
      handleCopy('sms', captainSMS.smsText);
    }
  };

  const toggleRadioAudio = () => {
    if (isPlayingRadioAudio && audioStopFn) {
      audioStopFn();
      setIsPlayingRadioAudio(false);
      setAudioStopFn(null);
      return;
    }

    const stop = playMarineRadioDistressAudio(
      radioPacket.spokenVhfScript,
      () => setIsPlayingRadioAudio(true),
      () => {
        setIsPlayingRadioAudio(false);
        setAudioStopFn(null);
      }
    );
    setAudioStopFn(() => stop);
  };

  // Direct SMS native URI
  const smsHref = `sms:${encodeURIComponent(captainSMS.targetPhone)}?body=${encodeURIComponent(captainSMS.smsText)}`;

  return (
    <div id="ocean-voyage-transponder" className="rounded-3xl border border-slate-800 bg-[#080d1a] shadow-2xl overflow-hidden backdrop-blur-xl">
      
      {/* Top Header */}
      <div className="p-4 sm:p-5 bg-[#030712] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
            isDeepSeaDeadzone 
              ? 'bg-rose-600/20 border-rose-500/50 text-rose-400 animate-pulse' 
              : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
          }`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Ocean Voyage Navigation & Auto-Radio Distress Transponder
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isDeepSeaDeadzone 
                  ? 'bg-rose-950 text-rose-300 border-rose-700 animate-bounce' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {isDeepSeaDeadzone ? '⚠️ SIGNAL JAMMED / AUTO-FAILOVER ACTIVE' : '✓ SATELLITE LINK ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Automatic Radio & GSM SMS Failover for Registered Vessels</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-300">{coastalStation.stationName} ({coastalStation.callsign})</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Signal Jammer Button */}
          <button
            onClick={onToggleJammer}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isInternetJammed
                ? 'bg-amber-600 text-white border-amber-400 shadow-amber-900/40 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Simulate signal jammer / deadzone at sea to trigger auto-radio and SMS dispatch"
          >
            {isInternetJammed ? <WifiOff className="w-3.5 h-3.5" /> : <Signal className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isInternetJammed ? 'Signal Jammed (Simulated)' : 'Simulate Signal Jam'}</span>
          </button>

          {/* Audio Radio Broadcast Button */}
          <button
            onClick={toggleRadioAudio}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
              isPlayingRadioAudio 
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-900/50' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
            }`}
            title="Broadcast registered distress message via simulated marine VHF radio voice and tones"
          >
            {isPlayingRadioAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isPlayingRadioAudio ? 'Halt Radio Siren' : 'Play VHF Radio Siren'}</span>
          </button>
        </div>
      </div>

      {/* Jamming Alert Banner if Jammed */}
      {isDeepSeaDeadzone && (
        <div className="p-3.5 bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-b border-rose-700/60 text-white flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
            <div className="text-xs sm:text-sm">
              <strong className="text-rose-200">SIGNAL JAMMED / INTERNET FAILED:</strong>{' '}
              <span>Autonomous failover active. Automatic 2G SMS dispatched to registered phone <strong className="text-white underline">{captainSMS.targetPhone}</strong> and emergency broadcast transmitting to <strong className="text-white">{coastalStation.stationName}</strong> on {coastalStation.primaryVhfChannel}!</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono bg-black/40 px-2.5 py-1 rounded-md border border-rose-500/40 text-rose-300 font-bold">
              TX TIME: {lastAutoDistressTime || radioPacket.timestamp}
            </span>
          </div>
        </div>
      )}

      {/* Main Transponder Body */}
      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Vessel Voyage Navigation Status Card */}
        <div className="p-4 rounded-2xl bg-[#030712] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          
          {/* Registered Captain & Craft */}
          <div className="space-y-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-slate-400 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Registered Captain</span>
              </span>
              <span className="text-emerald-400 font-bold">VERIFIED</span>
            </div>
            <div className="text-sm font-bold text-white truncate">
              {currentUser?.name || 'Captain Murugesan'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {currentUser?.boatName || 'Meenava Thalaivan'} ({currentUser?.boatRegNumber || 'IND-TN-02-MM-1088'})
            </div>
            <div className="text-[10px] text-slate-500">
              Phone: <strong className="text-cyan-400">{currentUser?.phone || '+91 94440 15540'}</strong>
            </div>
          </div>

          {/* Current Offshore Position */}
          <div className="space-y-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-slate-400 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>GPS Fix & Distance</span>
              </span>
              <span className="text-cyan-400 font-bold">{distanceOffshoreNm} NM</span>
            </div>
            <div className="text-sm font-bold text-white">
              {shipLat}°N, {shipLng}°E
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Departed: <strong className="text-slate-200">{villageName}</strong>, {stateName}
            </div>
            <div className="text-[10px] text-slate-500">
              Bearing {targetBearing}° • Speed {sensorReading.gpsSpeedKnots || 8.5} kts
            </div>
          </div>

          {/* Connection & Deadzone Monitor */}
          <div className="space-y-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-slate-400 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Network Link</span>
              </span>
              <span className={`font-bold ${isDeepSeaDeadzone ? 'text-rose-400' : 'text-emerald-400'}`}>
                {connectionState.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              {isDeepSeaDeadzone ? (
                <>
                  <WifiOff className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-300">Internet Severed (Jammed)</span>
                </>
              ) : (
                <>
                  <Signal className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Live Satellite Relay</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Failover: <strong className="text-emerald-400">SMS + VHF Ch 16</strong>
            </div>
            <div className="text-[10px] text-slate-500">
              Station: <strong className="text-white">{coastalStation.callsign}</strong>
            </div>
          </div>

          {/* Linked Ocean Telemetry Station */}
          <div className="space-y-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-slate-400 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <Waves className="w-3.5 h-3.5 text-blue-400" />
                <span>Local ARGO Profiler</span>
              </span>
              <span className="text-blue-400 font-bold">#{nearestFloat.wmoId}</span>
            </div>
            <div className="text-sm font-bold text-white">
              Swell: {nearestFloat.waveHeight}m • SST: {nearestFloat.surfaceTemp}°C
            </div>
            <div className="text-[11px] text-slate-400">
              TCHP Heat: <strong className="text-amber-400">{nearestFloat.tchp} kJ/cm²</strong>
            </div>
            <div className="text-[10px] text-slate-500">
              Hazard: <strong className={riskLevel === 'HIGH_RISK' ? 'text-rose-400' : 'text-slate-300'}>{riskLevel.replace(/_/g, ' ')}</strong>
            </div>
          </div>

        </div>

        {/* Offshore Distance Navigation Slider */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Vessel Distance Offshore (Test Jamming & Auto-SMS Failover):</span>
            </span>
            <span className="font-bold text-cyan-400">
              {distanceOffshoreNm} Nautical Miles from {villageName} ({Math.round(distanceOffshoreNm * 1.852)} km)
            </span>
          </div>
          
          <input
            type="range"
            min="1"
            max="45"
            step="0.5"
            value={distanceOffshoreNm}
            onChange={(e) => setDistanceOffshoreNm(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 NM (Harbor Basin - 4G/5G)</span>
            <span className="text-amber-400">12 NM (Cellular Edge)</span>
            <span className="text-rose-400 font-bold">20+ NM (Deadzone / Auto Radio & SMS Dispatch Trigger)</span>
            <span>45 NM (Deep ARGO Station)</span>
          </div>
        </div>

        {/* Tabbed Radio & SMS Message Viewers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('sms')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'sms' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
              <span>SMS to Registered Phone</span>
            </button>
            <button
              onClick={() => setActiveTab('radiostation')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'radiostation' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <TowerControl className="w-3.5 h-3.5 text-amber-300" />
              <span>Coastal Radio Station</span>
            </button>
            <button
              onClick={() => setActiveTab('script')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'script' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>VHF Channel 16 Siren</span>
            </button>
            <button
              onClick={() => setActiveTab('transponder')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'transponder' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Multi-Protocol Log
            </button>
            <button
              onClick={() => setActiveTab('dsc')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'dsc' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              DSC / AIS EPIRB
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'registry' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Captain Registry
            </button>
          </div>

          {/* 1. SMS to Registered Phone Number View */}
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Automated Emergency SMS to Registered Phone Number</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      GSM 2G/3G MESH QUEUE
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    When data fails at sea, the transponder formats and pushes this verified 160-character distress SMS to the captain and emergency contacts.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={smsHref}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open in Mobile SMS</span>
                  </a>
                  <button
                    onClick={handleShareSms}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:text-white transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Alert</span>
                  </button>
                  <button
                    onClick={() => handleCopy('sms', captainSMS.smsText)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:text-white transition-all"
                  >
                    {copiedKey === 'sms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'sms' ? 'Copied' : 'Copy SMS'}</span>
                  </button>
                </div>
              </div>

              {/* Target & Delivery Receipt Header Card */}
              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[11px]">Registered Mobile Number:</span>
                  <div className="text-white font-bold text-sm flex items-center gap-1.5 mt-0.5">
                    <PhoneForwarded className="w-4 h-4 text-emerald-400" />
                    <span>{captainSMS.targetPhone}</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">Captain: {captainSMS.captainName}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px]">Vessel Identification:</span>
                  <div className="text-white font-bold text-sm mt-0.5 truncate">
                    {captainSMS.boatName}
                  </div>
                  <div className="text-slate-400 text-[10px]">Reg: {captainSMS.boatRegNumber}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px]">GSM Delivery Confirmation:</span>
                  <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{smsDeliveryStatus.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">Timestamp: {lastSmsSentTime}</div>
                </div>
              </div>

              {/* Exact SMS Text Body */}
              <div className="p-4 rounded-2xl bg-black border border-emerald-900/60 font-mono text-xs text-emerald-400 leading-relaxed space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-emerald-950 pb-2">
                  <span>OUTGOING GSM TEXT PAYLOAD</span>
                  <span className="font-bold text-emerald-300">{captainSMS.charCount} / 160 Characters (1 SMS Segment)</span>
                </div>
                <div className="whitespace-pre-wrap select-all font-semibold tracking-wide py-1">
                  {captainSMS.smsText}
                </div>
              </div>

              {/* Automatic Network Route Explanation */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Automated GSM Dispatch Rule:</strong> If internet packets fail or cellular data drops below 2G bandwidth, this emergency SMS is automatically pushed across coastal cellular repeater towers (BSS) directly to the registered phone number, harbor master dispatch, and Indian Coast Guard Maritime Rescue Coordination Centre (MRCC Helpline 1554).
                </span>
              </div>
            </div>
          )}

          {/* 2. Coastal Radio Station View */}
          {activeTab === 'radiostation' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TowerControl className="w-4 h-4 text-amber-400" />
                    <span>Regional Coastal Marine Radio Station Network</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Direct maritime radio communication frequencies linked to your coastal sector.
                  </p>
                </div>

                <button
                  onClick={toggleRadioAudio}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                    isPlayingRadioAudio 
                      ? 'bg-rose-600 text-white animate-pulse' 
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {isPlayingRadioAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingRadioAudio ? 'Halt Radio siren' : 'Broadcast to Coastal Radio'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-500">Primary Radio Station:</span>
                  <div className="font-bold text-white text-sm">{coastalStation.stationName}</div>
                  <div className="text-amber-400 text-[11px] font-bold">Callsign: {coastalStation.callsign}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-500">Primary Channels & Frequencies:</span>
                  <div className="font-bold text-cyan-300">{coastalStation.primaryVhfChannel}</div>
                  <div className="text-slate-400 text-[11px]">MF/HF Distress: {coastalStation.hfDistressKhz} kHz</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-500">Maritime DSC MMSI:</span>
                  <div className="font-bold text-emerald-400 text-sm">{coastalStation.dscMmsi}</div>
                  <div className="text-slate-400 text-[11px]">Range: ~{coastalStation.transmissionRangeNm} NM Offshore</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-500">Coverage Sector:</span>
                  <div className="font-bold text-white">{coastalStation.coverageSector}</div>
                  <div className="text-slate-400 text-[11px]">Sector Center: {villageName}, {stateName}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-500">Coast Guard SAR Helpline:</span>
                  <div className="font-bold text-rose-400 text-sm">{coastalStation.mrccHelpline}</div>
                  <div className="text-slate-400 text-[11px]">24x7 Maritime Coordination</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-500">District Fisheries Control:</span>
                  <div className="font-bold text-slate-200 truncate">{coastalStation.districtFisheriesOfficer}</div>
                  <div className="text-slate-400 text-[11px]">Harbor Control Room Relay</div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Spoken VHF Script with Audio Siren */}
          {activeTab === 'script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-300">
                  Registered Spoken VHF Radio Distress Script ({coastalStation.primaryVhfChannel})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleRadioAudio}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                  >
                    {isPlayingRadioAudio ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    <span>{isPlayingRadioAudio ? 'Halt Audio' : 'Speak Radio Script'}</span>
                  </button>
                  <button
                    onClick={() => handleCopy('script', radioPacket.spokenVhfScript)}
                    className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 hover:text-white"
                  >
                    {copiedKey === 'script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'script' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed whitespace-pre-wrap">
                {radioPacket.spokenVhfScript}
              </div>
            </div>
          )}

          {/* 4. Transponder Transmission Log */}
          {activeTab === 'transponder' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {radioPacket.transmissionLog.map((log, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#030712] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-200">{log.protocol}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'TRANSMITTED' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {log.details}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Timestamp: {log.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. DSC Telegram */}
          {activeTab === 'dsc' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Marine Digital Selective Calling (DSC) & AIS EPIRB Encoded Telegram
                </span>
                <button
                  onClick={() => handleCopy('dsc', radioPacket.dscAlertFormat)}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 hover:text-white"
                >
                  {copiedKey === 'dsc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'dsc' ? 'Copied' : 'Copy Telegram'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap break-all">
                {radioPacket.dscAlertFormat}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Raw EPIRB Hex Burst (406.025 MHz):</span>
                <span className="text-cyan-400 font-bold">{radioPacket.rawTelegramHex}</span>
              </div>
            </div>
          )}

          {/* 6. Captain Registry Card */}
          {activeTab === 'registry' && (
            <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Seafarer & Vessel Registry Record</span>
                </h4>
                <span className="font-mono text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                  INDIAN COAST GUARD REGISTERED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div>
                  <span className="text-slate-500">Master / Captain:</span>
                  <div className="font-bold text-white text-sm">{radioPacket.captainName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Registered Phone:</span>
                  <div className="font-bold text-emerald-400 text-sm">{radioPacket.phone}</div>
                </div>
                <div>
                  <span className="text-slate-500">Vessel Name & Reg:</span>
                  <div className="font-bold text-white">{radioPacket.boatName} ({radioPacket.boatRegNumber})</div>
                </div>
                <div>
                  <span className="text-slate-500">Craft Type & Crew:</span>
                  <div className="font-bold text-white">{radioPacket.boatType} ({radioPacket.crewMembersCount} Crew)</div>
                </div>
                <div>
                  <span className="text-slate-500">Home Port & State:</span>
                  <div className="font-bold text-white">{radioPacket.homeVillageOrPort}, {radioPacket.state}</div>
                </div>
                <div>
                  <span className="text-slate-500">Maritime SAR Helpline:</span>
                  <div className="font-bold text-rose-400">1554 (Coast Guard MRCC)</div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
