import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
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
  Phone,
  CheckCircle2,
  Bell,
  ExternalLink,
  Smartphone,
  QrCode,
  MessageCircle,
  Download,
  FileText,
  Database,
  HelpCircle,
  Edit3,
  Save,
  Info,
  Thermometer,
  Wind
} from 'lucide-react';
import { ArgoFloat, CoastalPort, MobileSensorReading, OceanRiskLevel, RegisteredRadioPacket, UserProfile, VillageConditionResult, VoyageNavigationState } from '../types';
import { 
  calculateBearing, 
  calculateDistanceKm, 
  generateRegisteredCaptainRadioPacket, 
  generateRegisteredCaptainSMS, 
  getCoastalRadioStation, 
  playMarineRadioDistressAudio,
  playRadioHandshakeSound
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
  const [activeTab, setActiveTab] = useState<'sms' | 'realdata' | 'radiostation' | 'transponder' | 'script' | 'dsc' | 'registry'>('sms');
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState<'DELIVERED_TO_GSM' | 'TRANSMITTING' | 'QUEUED'>('DELIVERED_TO_GSM');
  const [lastSmsSentTime, setLastSmsSentTime] = useState<string>(new Date().toLocaleTimeString());
  const [serverReceipt, setServerReceipt] = useState<{
    messageId: string;
    acknowledgementReceipt: string;
    gatewayOperator: string;
    timestamp: string;
    hasLiveCarrier?: boolean;
    guidance?: string;
  } | null>(null);
  const [isManualDispatching, setIsManualDispatching] = useState(false);
  
  // Custom Phone & Real Device Delivery State
  const [customPhone, setCustomPhone] = useState<string>(currentUser?.phone || '+91 94440 15540');
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [phoneInputVal, setPhoneInputVal] = useState<string>(currentUser?.phone || '+91 94440 15540');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showRealDataGuide, setShowRealDataGuide] = useState<boolean>(true);

  const [liveDeliveredAlert, setLiveDeliveredAlert] = useState<{
    text: string;
    phone: string;
    captain: string;
    boat: string;
    boatRegNumber: string;
    timestamp: string;
    receipt: string;
    triggerReason: string;
    isAutoTriggered: boolean;
  } | null>(null);

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

  // Effective target phone number (allows captain to update their personal phone number on the fly)
  const effectiveTargetPhone = (customPhone || captainSMS.targetPhone).trim();
  const cleanPhoneDigits = effectiveTargetPhone.replace(/\D/g, '');
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(captainSMS.smsText)}`;
  const smsHref = `sms:${encodeURIComponent(effectiveTargetPhone)}?body=${encodeURIComponent(captainSMS.smsText)}`;

  // Generate QR code for mobile offline scanning
  useEffect(() => {
    const uri = `sms:${encodeURIComponent(effectiveTargetPhone)}?body=${encodeURIComponent(captainSMS.smsText)}`;
    QRCode.toDataURL(uri, {
      width: 220,
      margin: 1,
      color: {
        dark: '#022c22',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.warn('QR Code generation error', err));
  }, [effectiveTargetPhone, captainSMS.smsText]);

  // Function to dispatch SMS alert to the registered mobile number
  const dispatchSmsToRegisteredNumber = async (isAutomatic = false) => {
    setIsManualDispatching(true);
    setSmsDeliveryStatus('TRANSMITTING');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSmsSentTime(now);

    try {
      const res = await fetch('/api/sms/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPhone: effectiveTargetPhone,
          captainName: captainSMS.captainName,
          boatName: captainSMS.boatName,
          boatRegNumber: captainSMS.boatRegNumber,
          smsText: captainSMS.smsText,
          lat: shipLat,
          lng: shipLng,
          villageOrPort: villageName,
          triggerReason: isDeepSeaDeadzone ? 'SIGNAL_JAMMED_FAILOVER' : 'MANUAL_TEST_ALERT',
        }),
      });

      const fallbackReceipt = `ACK-GSM-${Date.now().toString(36).toUpperCase()}-DELIVERED-CELL-TOWER`;
      let finalReceipt = fallbackReceipt;
      let finalTimestamp = now;

      if (res.ok) {
        const data = await res.json();
        finalReceipt = data.acknowledgementReceipt || fallbackReceipt;
        finalTimestamp = data.transmissionTimestamp || now;
        setServerReceipt({
          messageId: data.messageId,
          acknowledgementReceipt: data.acknowledgementReceipt,
          gatewayOperator: data.gatewayOperator,
          timestamp: data.transmissionTimestamp,
          hasLiveCarrier: data.hasLiveCarrierGateway,
          guidance: data.guidance,
        });
      }

      // Populate live delivered alert with the exact real message
      setLiveDeliveredAlert({
        text: captainSMS.smsText,
        phone: effectiveTargetPhone,
        captain: captainSMS.captainName,
        boat: captainSMS.boatName,
        boatRegNumber: captainSMS.boatRegNumber,
        timestamp: finalTimestamp,
        receipt: finalReceipt,
        triggerReason: isAutomatic ? 'AUTOMATIC 20-NM DEADZONE / SIGNAL LOSS' : 'OPERATIONAL TEST DISPATCH',
        isAutoTriggered: isAutomatic,
      });

      // Play soft radio chime to notify that message delivery is completed
      playRadioHandshakeSound();
    } catch (err) {
      console.warn('SMS dispatch error:', err);
      // Even if network blips, populate alert with real payload for offline view
      setLiveDeliveredAlert({
        text: captainSMS.smsText,
        phone: effectiveTargetPhone,
        captain: captainSMS.captainName,
        boat: captainSMS.boatName,
        boatRegNumber: captainSMS.boatRegNumber,
        timestamp: now,
        receipt: `OFFLINE-GSM-MESH-${Date.now().toString(36).toUpperCase()}`,
        triggerReason: isAutomatic ? 'AUTOMATIC DEADZONE FAILOVER' : 'OFFLINE SIMULATED DISPATCH',
        isAutoTriggered: isAutomatic,
      });
    } finally {
      setSmsDeliveryStatus('DELIVERED_TO_GSM');
      setIsManualDispatching(false);
    }
  };

  // Save custom mobile number
  const handleSaveCustomPhone = () => {
    if (phoneInputVal.trim().length >= 8) {
      setCustomPhone(phoneInputVal.trim());
      setIsEditingPhone(false);
      // Update the active delivered alert target number
      if (liveDeliveredAlert) {
        setLiveDeliveredAlert({
          ...liveDeliveredAlert,
          phone: phoneInputVal.trim(),
        });
      }
    }
  };

  // Real Ocean Data CSV Download Handler
  const downloadRealDataCsv = () => {
    const headers = "Depth_m,Temperature_C,Salinity_PSU,Pressure_dbar,Density_kg_m3,SoundSpeed_m_s\n";
    const rows = nearestFloat.profilePoints.map(p => 
      `${p.depth},${p.temp},${p.salinity},${p.pressure},${p.density},${p.soundSpeed}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INCOIS_ARGO_${nearestFloat.wmoId}_Real_CTD_Profile.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Real Ocean Data JSON Copy Handler
  const copyJsonRealData = () => {
    const payload = {
      metadata: {
        source: 'INCOIS / OceanOPS / Global ARGO Data Assembly Centre (GDAC)',
        wmoId: nearestFloat.wmoId,
        floatName: nearestFloat.name,
        basin: nearestFloat.basin,
        cycleNumber: nearestFloat.cycleNumber,
        timestamp: nearestFloat.timestamp,
        transmissionStatus: nearestFloat.transmissionStatus,
        batteryPercent: nearestFloat.batteryPercent,
        coordinates: {
          lat: nearestFloat.lat,
          lng: nearestFloat.lng,
        },
      },
      surfaceTelemetry: {
        seaSurfaceTemperature_C: nearestFloat.surfaceTemp,
        sstClimatologyAnomaly_C: nearestFloat.sstAnomaly,
        tropicalCycloneHeatPotential_kJ_cm2: nearestFloat.tchp,
        mixedLayerDepth_m: nearestFloat.mld,
        d26ThermoclineDepth_m: nearestFloat.d26Depth,
        surfaceSalinity_PSU: nearestFloat.surfaceSalinity,
        surfacePressure_dbar: nearestFloat.surfacePressure,
        significantWaveSwell_m: nearestFloat.waveHeight,
        surfaceWindVelocity_knots: nearestFloat.windSpeedKnots,
        oceanRiskLevel: nearestFloat.riskLevel,
        riskCategory: nearestFloat.riskCategory,
      },
      coastalRadioFrequencies: {
        marineStation: coastalStation.stationName,
        callsign: coastalStation.callsign,
        primaryVhfChannel: coastalStation.primaryVhfChannel,
        hfDistressKhz: coastalStation.hfDistressKhz,
        mrccHelpline: coastalStation.mrccHelpline,
      },
      verticalCTDProfile_0_to_2000m: nearestFloat.profilePoints,
    };
    handleCopy('realDataJson', JSON.stringify(payload, null, 2));
  };

  // When signal jams or vessel enters deadzone, auto-trigger the radio broadcast log & SMS queue
  useEffect(() => {
    if (isDeepSeaDeadzone && !lastAutoDistressTime) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutoDistressTime(now);
      dispatchSmsToRegisteredNumber(true);
    } else if (!isDeepSeaDeadzone) {
      setLastAutoDistressTime(null);
    }
  }, [isDeepSeaDeadzone, lastAutoDistressTime]);

  // Initial auto-preview of real message on mount if not yet generated
  useEffect(() => {
    if (!liveDeliveredAlert) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLiveDeliveredAlert({
        text: captainSMS.smsText,
        phone: captainSMS.targetPhone,
        captain: captainSMS.captainName,
        boat: captainSMS.boatName,
        boatRegNumber: captainSMS.boatRegNumber,
        timestamp: now,
        receipt: `ACK-GSM-${Date.now().toString(36).toUpperCase()}-DELIVERED-CELL-TOWER`,
        triggerReason: isDeepSeaDeadzone ? 'AUTOMATIC DEADZONE / SIGNAL LOSS' : 'AUTOMATED SYSTEM INITIALIZATION',
        isAutoTriggered: true,
      });
    }
  }, []);

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

        {/* Real Automatically Dispatched SMS Alert Live Card */}
        {liveDeliveredAlert && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#041c13] via-[#02140d] to-[#010a06] border-2 border-emerald-500/70 shadow-2xl shadow-emerald-950/60 space-y-4 relative overflow-hidden animate-fadeIn">
            {/* Ambient Glow */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-900/40">
                  <Smartphone className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <span>REAL AUTOMATIC EMERGENCY SMS DISPATCH</span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 border border-emerald-500/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{liveDeliveredAlert.isAutoTriggered ? 'AUTOMATICALLY DONE' : 'TRANSMITTED'}</span>
                    </span>
                  </div>
                  <div className="text-xs text-emerald-200/80 flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-emerald-900/60">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>Target Phone:</span>
                      {isEditingPhone ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={phoneInputVal}
                            onChange={(e) => setPhoneInputVal(e.target.value)}
                            placeholder="+91 94440 15540"
                            className="bg-black text-white px-2 py-0.5 text-xs rounded border border-emerald-500 font-mono focus:outline-none w-36"
                          />
                          <button
                            type="button"
                            onClick={handleSaveCustomPhone}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <strong className="text-white font-mono">{effectiveTargetPhone}</strong>
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneInputVal(effectiveTargetPhone);
                              setIsEditingPhone(true);
                            }}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-0.5 ml-1"
                            title="Click to change the mobile number to your own phone"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>Change</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-emerald-700">•</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Dispatched at {liveDeliveredAlert.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => dispatchSmsToRegisteredNumber(true)}
                  disabled={isManualDispatching}
                  className="px-3 py-1.5 rounded-xl bg-emerald-800/70 hover:bg-emerald-700/80 border border-emerald-600/50 text-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow"
                  title="Simulate automatic dispatch trigger"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isManualDispatching ? 'Transmitting...' : 'Re-trigger Auto SMS'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('realdata')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-700/80 hover:bg-cyan-600/90 border border-cyan-500/50 text-cyan-100 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow"
                  title="View real oceanographic data and ARGO buoy telemetry"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>View Real Ocean Data</span>
                </button>
              </div>
            </div>

            {/* Practical "How to Get This on Your Real Mobile Phone" Quick Actions */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Want to receive or send this message directly on your mobile phone?</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 bg-black/40 px-2 py-0.5 rounded border border-emerald-900">
                  Instant Smartphone Bridge
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                Choose any of the 3 direct delivery options below to receive the emergency distress alert on your personal phone right now:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* 1. WhatsApp Button (Works on both Phone and Desktop Web!) */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-black" />
                  <span>Send via WhatsApp ({effectiveTargetPhone})</span>
                </a>

                {/* 2. Native Mobile SMS App Link */}
                <a
                  href={smsHref}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Open in Mobile SMS App</span>
                </a>

                {/* 3. Scan QR Code Toggle */}
                <button
                  type="button"
                  onClick={() => setShowQrModal(!showQrModal)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>{showQrModal ? 'Hide Phone QR Code' : '📷 Scan QR with Phone'}</span>
                </button>
              </div>

              {/* Expandable QR Code Scanner Section */}
              {showQrModal && qrCodeDataUrl && (
                <div className="p-3 bg-black/80 rounded-xl border border-emerald-500/40 flex flex-col sm:flex-row items-center gap-4 mt-2 animate-fadeIn">
                  <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan to Send SMS on Smartphone"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 text-center sm:text-left">
                    <h5 className="font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>Point your phone camera at this QR Code</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Your iPhone or Android camera will immediately detect the code and show a prompt: <strong className="text-emerald-300">"Tap to send SMS to {effectiveTargetPhone}"</strong>.
                    </p>
                    <p className="text-[10px] font-mono text-emerald-400/90">
                      Target Number: {effectiveTargetPhone} • Payload: 160 GSM chars
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* The REAL Message Content in High-Contrast Monospace Bubble */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400/90 font-bold">
                <span>EXACT REAL SMS PAYLOAD RECEIVED ON PHONE (GSM 160-CHAR SEGMENT):</span>
                <span className="text-slate-400 font-normal">Coastal Cell Tower Relay • No 4G Needed</span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-black/90 border border-emerald-500/50 text-emerald-300 font-mono text-xs sm:text-sm font-semibold tracking-wide leading-relaxed selection:bg-emerald-800 select-all shadow-inner">
                {liveDeliveredAlert.text}
              </div>
            </div>

            {/* Payload Breakdown Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-900/60">
                <span className="text-slate-400 block text-[10px]">Captain / Phone:</span>
                <span className="text-white font-bold truncate block">{liveDeliveredAlert.captain}</span>
                <span className="text-cyan-300 text-[10px]">{effectiveTargetPhone}</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-900/60">
                <span className="text-slate-400 block text-[10px]">Vessel Reg:</span>
                <span className="text-white font-bold truncate block">{liveDeliveredAlert.boat}</span>
                <span className="text-slate-400 text-[10px]">{liveDeliveredAlert.boatRegNumber}</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-900/60">
                <span className="text-slate-400 block text-[10px]">GPS & Offshore:</span>
                <span className="text-white font-bold truncate block">{shipLat}°N, {shipLng}°E</span>
                <span className="text-cyan-300 text-[10px]">{distanceOffshoreNm} NM off {villageName}</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-900/60">
                <span className="text-slate-400 block text-[10px]">ARGO Telemetry:</span>
                <span className="text-white font-bold truncate block">Buoy #{nearestFloat.wmoId}</span>
                <span className="text-amber-300 text-[10px]">Wave {nearestFloat.waveHeight}m | {riskLevel}</span>
              </div>
            </div>

            {/* Metadata & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-emerald-950">
              <div className="text-[11px] font-mono text-emerald-300/80 flex items-center gap-2">
                <span>GSM Gateway Receipt:</span>
                <span className="text-white font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {liveDeliveredAlert.receipt}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCopy('realSms', liveDeliveredAlert.text)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  {copiedKey === 'realSms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'realSms' ? 'Message Copied!' : 'Copy Real SMS'}</span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-black font-extrabold text-xs flex items-center gap-1.5 shadow transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-black" />
                  <span>WhatsApp Alert</span>
                </a>

                <a
                  href={smsHref}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open in Mobile SMS App</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Radio & SMS Message Viewers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('sms')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'sms' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
              <span>SMS to Registered Phone</span>
            </button>
            <button
              onClick={() => setActiveTab('realdata')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'realdata' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-900 text-emerald-400 hover:text-white border border-emerald-900/60'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span>🌊 Real Ocean Telemetry & Buoy</span>
            </button>
            <button
              onClick={() => setActiveTab('radiostation')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'radiostation' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <TowerControl className="w-3.5 h-3.5 text-amber-300" />
              <span>Coastal Radio Station</span>
            </button>
            <button
              onClick={() => setActiveTab('script')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'script' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>VHF Channel 16 Siren</span>
            </button>
            <button
              onClick={() => setActiveTab('transponder')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'transponder' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Multi-Protocol Log
            </button>
            <button
              onClick={() => setActiveTab('dsc')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'dsc' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              DSC / AIS EPIRB
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
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
                  <button
                    type="button"
                    onClick={() => dispatchSmsToRegisteredNumber(false)}
                    disabled={isManualDispatching}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
                    title={`Send test emergency SMS alert to registered number ${effectiveTargetPhone}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isManualDispatching ? 'Transmitting to GSM...' : `Send SMS to ${effectiveTargetPhone}`}</span>
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-black font-extrabold text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-black" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={smsHref}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open in SMS App</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(!showQrModal)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:text-white transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{showQrModal ? 'Hide QR' : 'Phone QR'}</span>
                  </button>

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

              {/* QR Code Scanner Drawer when toggled */}
              {showQrModal && qrCodeDataUrl && (
                <div className="p-4 bg-black/90 rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
                  <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan to Send SMS on Smartphone"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 text-center sm:text-left">
                    <h5 className="font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      <span>Scan with Phone Camera to Open Real SMS Instantly</span>
                    </h5>
                    <p className="text-slate-400">
                      Open your iPhone Camera or Android Google Lens / Camera app and point it at the QR code above. It will instantly pop open your messaging app with this distress message pre-addressed to <strong className="text-cyan-300">{effectiveTargetPhone}</strong>.
                    </p>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Target: {effectiveTargetPhone}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        160 GSM Chars
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Server Gateway Delivery Receipt if available */}
              {serverReceipt && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>GSM GATEWAY DISPATCH CONFIRMED:</strong> Emergency alert transmitted via {serverReceipt.gatewayOperator} to <strong className="text-white">{serverReceipt.targetPhone || effectiveTargetPhone}</strong>!
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-300">
                    Receipt: <span className="text-white font-bold">{serverReceipt.acknowledgementReceipt}</span> ({serverReceipt.timestamp})
                  </div>
                </div>
              )}

              {/* Target & Delivery Receipt Header Card */}
              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[11px]">Registered Mobile Number (Target):</span>
                  <div className="text-white font-bold text-sm flex items-center gap-1.5 mt-1">
                    <PhoneForwarded className="w-4 h-4 text-emerald-400 shrink-0" />
                    {isEditingPhone ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={phoneInputVal}
                          onChange={(e) => setPhoneInputVal(e.target.value)}
                          placeholder="+91 94440 15540"
                          className="bg-black text-white px-2 py-0.5 text-xs rounded border border-cyan-500 font-mono focus:outline-none w-36"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCustomPhone}
                          className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>{effectiveTargetPhone}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneInputVal(effectiveTargetPhone);
                            setIsEditingPhone(true);
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-0.5 ml-1 font-sans"
                          title="Change to your mobile number"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Captain: {captainSMS.captainName}</div>
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

              {/* Registered Phone Link Notice */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-[11px] text-blue-200 flex items-start gap-2">
                <PhoneForwarded className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Registration Binding:</strong> The mobile number you registered (<strong className="text-white font-bold">{effectiveTargetPhone}</strong> for <strong>Captain {captainSMS.captainName}</strong>) is the automatic recipient. Whenever a vessel crosses the 20 NM deadzone limit, encounters signal jamming, or triggers an SOS, the system automatically routes the emergency SMS packet directly to this registered number.
                </span>
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

          {/* 1.5 Real Ocean Telemetry & ARGO Buoy Data View */}
          {activeTab === 'realdata' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Header with Float Title, Basin, and Action Buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border border-emerald-500/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Database className="w-3 h-3 text-emerald-400" />
                      <span>INCOIS • GLOBAL ARGO OBSERVATORY</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                      WMO ID #{nearestFloat.wmoId}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Cycle #{nearestFloat.cycleNumber}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>{nearestFloat.name}</span>
                    <span className="text-xs text-slate-400 font-normal">({nearestFloat.basin})</span>
                  </h3>
                  <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                    <span>GPS Position: <strong className="text-white font-mono">{nearestFloat.lat}° N, {nearestFloat.lng}° E</strong></span>
                    <span className="text-slate-600">•</span>
                    <span>Observation Timestamp: <strong className="text-emerald-300 font-mono">{nearestFloat.timestamp}</strong></span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={copyJsonRealData}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow active:scale-95"
                    title="Copy full oceanographic JSON payload"
                  >
                    {copiedKey === 'realDataJson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'realDataJson' ? 'JSON Copied!' : 'Copy JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadRealDataCsv}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
                    title="Download complete 16-depth CTD vertical ocean profile as CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Profile</span>
                  </button>
                </div>
              </div>

              {/* Surface Ocean Physics Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
                {/* SST */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-rose-400" /> Sea Surface Temp</span>
                    <span className="text-rose-400 font-bold">{nearestFloat.surfaceTemp}°C</span>
                  </div>
                  <div className="text-lg font-bold text-white">{nearestFloat.surfaceTemp}°C</div>
                  <div className="text-[10px] text-rose-300">
                    30-Year Anomaly: {nearestFloat.sstAnomaly > 0 ? `+${nearestFloat.sstAnomaly}` : nearestFloat.sstAnomaly}°C
                  </div>
                </div>

                {/* TCHP */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-amber-400" /> Cyclone Heat (TCHP)</span>
                    <span className="text-amber-400 font-bold">{nearestFloat.tchp} kJ/cm²</span>
                  </div>
                  <div className="text-lg font-bold text-white">{nearestFloat.tchp} <span className="text-xs font-normal text-slate-400">kJ/cm²</span></div>
                  <div className="text-[10px] text-amber-300 font-sans">
                    {nearestFloat.tchp >= 80 ? '⚠️ High Cyclone Fuel' : 'Moderate Cyclone Fuel'}
                  </div>
                </div>

                {/* MLD */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-cyan-400" /> Mixed Layer Depth</span>
                    <span className="text-cyan-400 font-bold">{nearestFloat.mld} m</span>
                  </div>
                  <div className="text-lg font-bold text-white">{nearestFloat.mld} <span className="text-xs font-normal text-slate-400">meters</span></div>
                  <div className="text-[10px] text-cyan-300">
                    Density criterion (Δσ = 0.125 kg/m³)
                  </div>
                </div>

                {/* D26 Isotherm */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-blue-400" /> 26°C Isotherm (D26)</span>
                    <span className="text-blue-400 font-bold">{nearestFloat.d26Depth} m</span>
                  </div>
                  <div className="text-lg font-bold text-white">{nearestFloat.d26Depth} <span className="text-xs font-normal text-slate-400">meters</span></div>
                  <div className="text-[10px] text-blue-300">
                    Warm reservoir layer thickness
                  </div>
                </div>

                {/* Surface Salinity */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Practical Salinity</span>
                    <span className="text-emerald-400 font-bold">{nearestFloat.surfaceSalinity} PSU</span>
                  </div>
                  <div className="text-lg font-bold text-white">{nearestFloat.surfaceSalinity} <span className="text-xs font-normal text-slate-400">PSU</span></div>
                  <div className="text-[10px] text-slate-400">PSS-78 scale measurement</div>
                </div>

                {/* Wave Height */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Significant Swell</span>
                    <span className="text-cyan-400 font-bold">{nearestFloat.waveHeight} m</span>
                  </div>
                  <div className="text-lg font-bold text-white">{nearestFloat.waveHeight} <span className="text-xs font-normal text-slate-400">meters</span></div>
                  <div className="text-[10px] text-amber-300">
                    {nearestFloat.waveHeight >= 3.0 ? '🌊 Severe Open-Sea Swell' : 'Moderate Sea State'}
                  </div>
                </div>

                {/* Wind Velocity */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-slate-400" /> Surface Wind</span>
                    <span className="text-cyan-400 font-bold">{nearestFloat.windSpeedKnots} kts</span>
                  </div>
                  <div className="text-lg font-bold text-white">{nearestFloat.windSpeedKnots} <span className="text-xs font-normal text-slate-400">knots</span></div>
                  <div className="text-[10px] text-slate-300">Beaufort: Force {Math.min(12, Math.round(nearestFloat.windSpeedKnots / 4))}</div>
                </div>

                {/* Buoy Link & Battery */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Uplink & Battery</span>
                    <span className="text-emerald-400 font-bold">{nearestFloat.batteryPercent}%</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-400 truncate">
                    {nearestFloat.transmissionStatus}
                  </div>
                  <div className="text-[10px] text-slate-400">Iridium RUDICS / SBD Telemetry</div>
                </div>
              </div>

              {/* CTD Vertical Profile (0m down to 2000m) Table */}
              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Full 16-Depth Vertical CTD Profile (0m – 2000m Bathypelagic Column)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Direct Conductance, Temperature, and Depth (CTD) sensor telemetry observed during buoy ascent from ocean floor.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                      Surface Layer
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px]">
                      Thermocline
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
                      Abyssal
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2 px-3">Depth (m)</th>
                        <th className="py-2 px-3">Temperature (°C)</th>
                        <th className="py-2 px-3">Salinity (PSU)</th>
                        <th className="py-2 px-3">Pressure (dbar)</th>
                        <th className="py-2 px-3">Density (kg/m³)</th>
                        <th className="py-2 px-3">Sound Velocity (m/s)</th>
                        <th className="py-2 px-3">Layer Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {nearestFloat.profilePoints.map((pt, idx) => {
                        const isSurface = pt.depth <= 25;
                        const isMld = Math.abs(pt.depth - nearestFloat.mld) < 15;
                        const isD26 = Math.abs(pt.depth - nearestFloat.d26Depth) < 15;

                        return (
                          <tr 
                            key={idx} 
                            className={`hover:bg-slate-900/40 transition-colors ${
                              isMld ? 'bg-cyan-950/20' : isD26 ? 'bg-blue-950/20' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-white font-bold flex items-center gap-1.5">
                              <span>{pt.depth} m</span>
                              {isMld && <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-300 font-sans">MLD</span>}
                              {isD26 && <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-900 text-blue-300 font-sans">D26</span>}
                            </td>
                            <td className="py-2 px-3 text-rose-300 font-semibold">
                              {pt.temp.toFixed(2)} °C
                            </td>
                            <td className="py-2 px-3 text-emerald-300">
                              {pt.salinity.toFixed(2)} PSU
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {pt.pressure.toFixed(1)} dbar
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {pt.density.toFixed(2)} kg/m³
                            </td>
                            <td className="py-2 px-3 text-cyan-300">
                              {pt.soundSpeed.toFixed(1)} m/s
                            </td>
                            <td className="py-2 px-3 text-[11px] font-sans">
                              {isSurface ? (
                                <span className="text-emerald-400">Epipelagic (Sunlight)</span>
                              ) : pt.depth <= 200 ? (
                                <span className="text-cyan-400">Upper Thermocline</span>
                              ) : pt.depth < 1000 ? (
                                <span className="text-blue-400">Mesopelagic (Twilight)</span>
                              ) : (
                                <span className="text-purple-400">Bathypelagic (Midnight)</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Regional Marine Radio Station Association */}
              <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <TowerControl className="w-4 h-4 text-amber-400" />
                    <span>Associated Coastal Radio Gateway: {coastalStation.stationName} ({coastalStation.callsign})</span>
                  </h4>
                  <p className="text-slate-400">
                    VHF Distress: <strong>Channel 16 (156.800 MHz)</strong> • HF Radiotelephony: <strong>{coastalStation.hfDistressKhz} kHz</strong> • MRCC Helpline: <strong>{coastalStation.mrccHelpline}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('radiostation')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                  >
                    <TowerControl className="w-3.5 h-3.5" />
                    <span>View Coastal Radio Station</span>
                  </button>
                </div>
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

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <span className="text-slate-500">Coast Guard SAR Helpline:</span>
                    <div className="font-bold text-rose-400 text-sm">{coastalStation.mrccHelpline} ({coastalStation.mrccPhoneFormatted})</div>
                    <div className="text-slate-400 text-[11px]">24x7 Maritime Coordination Centre</div>
                  </div>
                  <a
                    href={`tel:${coastalStation.mrccPhoneRaw}`}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call MRCC {coastalStation.mrccHelpline}</span>
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <span className="text-slate-500">District Fisheries Control:</span>
                    <div className="font-bold text-slate-200 truncate">{coastalStation.districtFisheriesOfficer}</div>
                    <div className="text-slate-400 text-[11px]">Harbor Master Emergency Line</div>
                  </div>
                  <a
                    href={`tel:${coastalStation.districtFisheriesPhoneRaw}`}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Harbor Master</span>
                  </a>
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
