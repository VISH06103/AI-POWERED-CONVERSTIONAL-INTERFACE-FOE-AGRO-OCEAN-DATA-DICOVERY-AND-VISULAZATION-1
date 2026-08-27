import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { RiskAlertBanner } from './components/RiskAlertBanner';
import { OceanMap } from './components/OceanMap';
import { ChatAssistant } from './components/ChatAssistant';
import { DepthProfileModal } from './components/DepthProfileModal';
import { EmergencyBroadcastModal } from './components/EmergencyBroadcastModal';
import { OfflineCacheManager } from './components/OfflineCacheManager';
import { SimulationModal } from './components/SimulationModal';
import { LoginPage } from './components/LoginPage';
import { VillageStateConditionFinder } from './components/VillageStateConditionFinder';
import { MobileSensorTelemetryHUD } from './components/MobileSensorTelemetryHUD';
import { OceanVoyageRadioTransponder } from './components/OceanVoyageRadioTransponder';
import { useMobileSensors } from './hooks/useMobileSensors';
import { ArgoFloat, CoastalPort, OceanRiskLevel, SimulationPreset, UserProfile, VillageConditionResult, VoyageNavigationState } from './types';
import { BASE_ARGO_FLOATS, COASTAL_PORTS, getEnrichedFloats, SIMULATION_PRESETS } from './data/argoDataset';
import { DEMO_CAPTAINS, identifyVillageOrStateCondition } from './data/coastalVillages';
import { calculateDistanceKm, evaluateOceanRisk } from './utils/oceanPhysics';
import { 
  Anchor, 
  Flame, 
  Waves, 
  Compass, 
  LifeBuoy, 
  Radio, 
  Activity, 
  Layers, 
  Info,
  Sparkles,
  Search,
  Sliders,
  User,
  ShieldCheck,
  MapPin
} from 'lucide-react';

export default function App() {
  // User Profile state (loaded from local storage or null if not yet logged in)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('floatchat_user_profile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading stored user profile:', e);
    }
    return null; // Show Login & Setup first on fresh visit
  });

  // Open Login / Profile form first when visiting
  const [isLoginPageOpen, setIsLoginPageOpen] = useState<boolean>(true);

  // State variables
  const [ports, setPorts] = useState<CoastalPort[]>(COASTAL_PORTS);
  const [selectedPort, setSelectedPort] = useState<CoastalPort>(() => {
    // If user has a village/port in mind, match or default to Chennai / Kasimedu
    return COASTAL_PORTS[1] || COASTAL_PORTS[0]; // Chennai Kasimedu
  });
  const [rawFloats, setRawFloats] = useState<ArgoFloat[]>(getEnrichedFloats(BASE_ARGO_FLOATS));
  const [activePreset, setActivePreset] = useState<SimulationPreset>(SIMULATION_PRESETS[0]);
  const [currentLanguage, setCurrentLanguage] = useState<string>(currentUser?.language || 'ta');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activeVillageResult, setActiveVillageResult] = useState<VillageConditionResult | null>(null);

  // Mobile Sensors & Jammed Network Manager Hook
  const {
    sensorReading,
    isInternetJammed,
    hasHardwareSensors,
    permissionState,
    requestSensorAccess,
    setSimulatedRoll,
    setSimulatedPitch,
    setSimulatedHeading,
    setSimulatedBaroHpa,
  } = useMobileSensors({
    isSimulatedJammed: isOffline,
    onJammerAlert: () => setIsOffline(true),
  });

  // Ocean Voyage & Transponder State (Live GPS Track offshore & auto radio when jammed)
  const [voyageState, setVoyageState] = useState<VoyageNavigationState | null>(null);

  // Modals
  const [inspectFloat, setInspectFloat] = useState<ArgoFloat | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState<boolean>(false);
  const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState<boolean>(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState<boolean>(false);
  const [externalChatQuery, setExternalChatQuery] = useState<string>('');

  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Sync user profile changes to language & ports
  useEffect(() => {
    if (currentUser?.language) {
      setCurrentLanguage(currentUser.language);
    }
  }, [currentUser]);

  // Apply simulation offsets to floats
  const floats = useMemo(() => {
    return rawFloats.map(float => {
      let temp = float.surfaceTemp + activePreset.tempDelta;
      let tchp = Math.max(0, float.tchp + activePreset.tchpDelta);
      let wave = Math.max(0.5, Math.round((float.waveHeight + activePreset.waveDelta) * 10) / 10);
      let d26 = Math.max(15, float.d26Depth + (activePreset.tchpDelta > 0 ? 15 : activePreset.tchpDelta < 0 ? -15 : 0));

      const modified: ArgoFloat = {
        ...float,
        surfaceTemp: Math.round(temp * 10) / 10,
        tchp: Math.round(tchp * 10) / 10,
        waveHeight: wave,
        d26Depth: d26,
        riskLevel: activePreset.id !== 'sim-live-real' ? activePreset.riskLevel : float.riskLevel,
      };

      const reEval = evaluateOceanRisk(modified);
      return {
        ...modified,
        riskLevel: activePreset.id !== 'sim-live-real' ? activePreset.riskLevel : reEval.riskLevel,
      };
    });
  }, [rawFloats, activePreset]);

  // Determine nearest ARGO float to currently selected port
  const selectedFloat = useMemo(() => {
    let closest = floats[0];
    let minDistance = Infinity;

    for (const float of floats) {
      const dist = calculateDistanceKm(selectedPort.lat, selectedPort.lng, float.lat, float.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = float;
      }
    }
    return closest;
  }, [floats, selectedPort]);

  // Overall evaluated risk for selected port
  const currentRiskLevel: OceanRiskLevel = selectedFloat.riskLevel;

  // Voice Text-to-Speech synthesizer
  const handlePlayVoice = (text: string) => {
    if (isVoiceMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetLangCode = currentLanguage === 'ta' ? 'ta'
      : currentLanguage === 'ml' ? 'ml'
      : currentLanguage === 'hi' ? 'hi'
      : currentLanguage === 'te' ? 'te'
      : currentLanguage === 'bn' ? 'bn'
      : currentLanguage === 'gu' ? 'gu'
      : currentLanguage === 'mr' ? 'mr'
      : 'en';

    const matchVoice = voices.find(v => v.lang.startsWith(targetLangCode));
    if (matchVoice) utterance.voice = matchVoice;

    window.speechSynthesis.speak(utterance);
  };

  // GPS User Location finder
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        let closestPort = ports[0];
        let minDist = Infinity;

        ports.forEach(port => {
          const dist = calculateDistanceKm(userLat, userLng, port.lat, port.lng);
          if (dist < minDist) {
            minDist = dist;
            closestPort = port;
          }
        });

        setSelectedPort(closestPort);
        setIsLocating(false);
        setExternalChatQuery(`I am at latitude ${userLat.toFixed(2)}, longitude ${userLng.toFixed(2)} (nearest harbor: ${closestPort.name}). What are my sea safety conditions today?`);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        alert('Could not retrieve GPS location. Please choose your coastal village/port from the finder below.');
      },
      { timeout: 10000 }
    );
  };

  const handleRefreshCache = () => {
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setRawFloats(getEnrichedFloats(BASE_ARGO_FLOATS));
  };

  // When a village/state is identified in the finder and set as active location
  const handleSetActiveLocation = (res: VillageConditionResult) => {
    const newPort: CoastalPort = {
      id: `port-${res.villageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: `${res.villageName} (${res.state})`,
      nativeName: res.matchedVillage?.nativeName || res.villageName,
      country: 'India',
      lat: res.lat,
      lng: res.lng,
      state: res.state,
      basin: res.basin as any,
      primaryLanguage: res.state === 'Tamil Nadu' ? 'ta' 
        : res.state === 'Kerala' ? 'ml' 
        : res.state === 'Andhra Pradesh' ? 'te' 
        : res.state === 'West Bengal' ? 'bn' 
        : res.state === 'Gujarat' ? 'gu' 
        : res.state === 'Maharashtra' ? 'mr' 
        : res.state === 'Odisha' ? 'or' 
        : 'en',
      coastGuardContact: 'VHF Emergency Channel 16 / Helpline: 1554',
      vhfChannel: 'Ch 16 / 68',
      currentWarningStatus: res.riskLevel,
      activeBoatsCount: 350,
    };

    // Add to ports list if not existing
    setPorts(prev => {
      if (prev.some(p => p.name === newPort.name)) return prev;
      return [newPort, ...prev];
    });

    setActiveVillageResult(res);
    setSelectedPort(newPort);
    setCurrentLanguage(newPort.primaryLanguage);
    setExternalChatQuery(`Tell me about current sea conditions near ${res.villageName} (${res.state}) and ARGO float #${res.nearestFloat.wmoId}.`);
  };

  // Handle Login / Registration
  const handleLoginUser = (profile: UserProfile) => {
    setCurrentUser(profile);
    setIsLoginPageOpen(false);
    
    // Auto resolve condition & map tracking for user's village or state
    try {
      const villageLookup = profile.villageOrPort || profile.state;
      const res = identifyVillageOrStateCondition(villageLookup, floats, isOffline);
      handleSetActiveLocation(res);
    } catch {
      // Auto sync location fallback
      const matched = COASTAL_PORTS.find(p => p.state === profile.state || profile.villageOrPort.includes(p.name));
      if (matched) {
        setSelectedPort(matched);
      }
    }

    if (profile.language) {
      setCurrentLanguage(profile.language);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('floatchat_user_profile');
    } catch (e) {
      console.warn(e);
    }
    setIsLoginPageOpen(true);
  };

  // If login modal is opened as standalone view
  if (isLoginPageOpen) {
    return (
      <LoginPage
        currentUser={currentUser}
        onLogin={handleLoginUser}
        onContinueGuest={() => setIsLoginPageOpen(false)}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation & App Bar */}
      <Header
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
        selectedPort={selectedPort}
        onSelectPort={setSelectedPort}
        allPorts={ports}
        currentLanguage={currentLanguage}
        onChangeLanguage={setCurrentLanguage}
        isVoiceMuted={isVoiceMuted}
        onToggleVoice={() => setIsVoiceMuted(!isVoiceMuted)}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onOpenOfflineManager={() => setIsOfflineManagerOpen(true)}
        onOpenBroadcast={() => setIsBroadcastOpen(true)}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginPageOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-5">
        
        {/* Offline Sea Mode Active Notice if Disconnected */}
        {isOffline && (
          <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <LifeBuoy className="w-5 h-5 text-amber-400 animate-spin-slow shrink-0" />
              <span>
                <strong>Offline Sea Mode Active:</strong> Operating on cached ARGO float profiles & onboard deterministic physics rules. Warnings remain 100% functional at sea without internet.
              </span>
            </div>
            <button
              onClick={() => setIsOffline(false)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow transition-all"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* User Profile Bar on Dashboard */}
        {currentUser && (
          <div className="p-3 sm:p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-base shadow-inner">
                <Anchor className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Captain {currentUser.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    {currentUser.boatName} ({currentUser.boatType.split(' ')[0]})
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Base Port: <strong>{currentUser.villageOrPort}</strong>, {currentUser.state}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-[11px] text-slate-500">{currentUser.boatRegNumber}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setIsLoginPageOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Switch Profile / Village</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-700/80 text-xs font-semibold text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                title="Logout"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* State & Coastal Village Ocean Condition Finder (User Request: "i enter any state or village it will identify and give results") */}
        <VillageStateConditionFinder
          floats={floats}
          isOffline={isOffline}
          onSelectFloat={(fl) => setInspectFloat(fl)}
          onOpenDepthProfile={(fl) => setInspectFloat(fl)}
          onSetActiveLocation={handleSetActiveLocation}
          initialQuery={currentUser?.villageOrPort || 'Kasimedu'}
          compassHeading={sensorReading.compassHeading}
        />

        {/* Mobile Vessel Sensor Telemetry HUD (Works Online and Jammed/Offline) */}
        <MobileSensorTelemetryHUD
          sensorReading={sensorReading}
          isInternetJammed={isInternetJammed || isOffline}
          onToggleJammer={() => setIsOffline(!isOffline)}
          targetTrack={activeVillageResult?.trackInfo}
          onPlayVoice={handlePlayVoice}
          hasHardwareSensors={hasHardwareSensors}
          onRequestSensorAccess={requestSensorAccess}
          onUpdateSimulatedRoll={setSimulatedRoll}
          onUpdateSimulatedPitch={setSimulatedPitch}
          onUpdateSimulatedHeading={setSimulatedHeading}
          onUpdateSimulatedBaro={setSimulatedBaroHpa}
        />

        {/* Automated Ocean Voyage & Radio Distress Transponder (Auto connects & sends radio message when jammed at sea) */}
        <OceanVoyageRadioTransponder
          currentUser={currentUser}
          activeVillageResult={activeVillageResult}
          nearestFloat={selectedFloat}
          riskLevel={currentRiskLevel}
          sensorReading={sensorReading}
          isSimulatedJammedExternal={isOffline || isInternetJammed}
          onToggleJammerExternal={() => setIsOffline(!isOffline)}
          onVoyageStateChange={setVoyageState}
        />

        {/* Primary Large Risk Alert Banner */}
        <RiskAlertBanner
          riskLevel={currentRiskLevel}
          nearestFloat={selectedFloat}
          selectedPort={selectedPort}
          language={currentLanguage}
          onPlayVoice={handlePlayVoice}
          onOpenDepthProfile={(f) => setInspectFloat(f)}
          onOpenBroadcast={() => setIsBroadcastOpen(true)}
          onAskChatbot={(q) => setExternalChatQuery(q)}
          activeVillageResult={activeVillageResult}
        />

        {/* Two-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Interactive Ocean Map & ARGO Floats List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Leaflet Ocean Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400" />
                  <span>ARGO Float Telemetry & Cyclone Heat Map</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {floats.length} Active Ocean Buoys
                </span>
              </div>

              <OceanMap
                floats={floats}
                ports={ports}
                selectedFloat={selectedFloat}
                selectedPort={selectedPort}
                onSelectFloat={(f) => setInspectFloat(f)}
                onSelectPort={setSelectedPort}
                onOpenDepthProfile={(f) => setInspectFloat(f)}
                activeTrackedLocation={activeVillageResult}
                onLocationTracked={(res) => handleSetActiveLocation(res)}
                onAskChat={(query) => setExternalChatQuery(query)}
                voyageState={voyageState}
                currentUser={currentUser}
              />
            </div>

            {/* Quick ARGO Floats Selector Strip */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nearest Ocean Profilers to {selectedPort.name.split(' ')[0]}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {floats.slice(0, 4).map((fl) => {
                  const isCur = fl.id === selectedFloat.id;
                  const isHigh = fl.riskLevel === 'HIGH_RISK';
                  const isMod = fl.riskLevel === 'MODERATE_RISK';

                  return (
                    <div
                      key={fl.id}
                      onClick={() => setInspectFloat(fl)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isCur
                          ? 'bg-[#0b0f19] border-blue-500 shadow-xl shadow-blue-950/30 ring-1 ring-blue-500/50'
                          : 'bg-[#0b0f19]/80 border-slate-800 hover:border-slate-700 hover:bg-[#0b0f19]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-blue-300">
                          #{fl.wmoId}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isHigh ? 'bg-red-950 text-red-300 border border-red-800' : isMod ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {fl.riskLevel.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5 truncate">{fl.name}</h4>
                      <div className="mt-2.5 grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400">
                        <div>TCHP: <span className="font-bold text-slate-200">{fl.tchp}</span></div>
                        <div>D26: <span className="font-bold text-slate-200">{fl.d26Depth}m</span></div>
                        <div>SST: <span className="font-bold text-slate-200">{fl.surfaceTemp}°C</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: AI Conversational Chat Assistant (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <ChatAssistant
              selectedPort={selectedPort}
              selectedFloat={selectedFloat}
              currentLanguage={currentLanguage}
              isOffline={isOffline}
              onPlayVoice={handlePlayVoice}
              externalQuery={externalChatQuery}
              onClearExternalQuery={() => setExternalChatQuery('')}
              currentUser={currentUser}
              activeVillageResult={activeVillageResult}
              floats={floats}
              onLocationTracked={handleSetActiveLocation}
            />

            {/* Quick Emergency Broadcast / Simulation Trigger Box */}
            <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800 flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-900/30">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Harbor Master Emergency Hub</h4>
                  <p className="text-[11px] text-slate-400">Generate VHF Securite & 160-Char SMS</p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition-all active:scale-95"
              >
                Broadcast
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Modals */}
      <DepthProfileModal
        float={inspectFloat}
        isOpen={Boolean(inspectFloat)}
        onClose={() => setInspectFloat(null)}
      />

      <EmergencyBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        selectedPort={selectedPort}
        nearestFloat={selectedFloat}
        riskLevel={currentRiskLevel}
        currentUser={currentUser}
        activeVillageResult={activeVillageResult}
        sensorReading={sensorReading}
        isInternetJammed={isInternetJammed || isOffline}
      />

      <OfflineCacheManager
        isOpen={isOfflineManagerOpen}
        onClose={() => setIsOfflineManagerOpen(false)}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
        cachedFloats={floats}
        cachedPorts={ports}
        lastSyncTime={lastSyncTime}
        onRefreshCache={handleRefreshCache}
      />

      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        activePresetId={activePreset.id}
        onApplyPreset={setActivePreset}
      />

      {/* Advisory Warning Marquee Strip */}
      <div className="mt-8 h-12 sm:h-14 bg-amber-500 flex items-center px-4 sm:px-8 text-slate-950 font-bold overflow-hidden shadow-2xl">
        <div className="whitespace-nowrap flex items-center gap-8 sm:gap-12 text-xs sm:text-sm tracking-wide">
          <span className="flex items-center gap-2">
            <span className="text-base sm:text-lg">⚠️</span> 
            <span>ADVISORY: {currentRiskLevel === 'HIGH_RISK' ? 'CYCLONIC CIRCULATION / SEVERE SWELL THREAT IN SECTOR' : currentRiskLevel === 'MODERATE_RISK' ? 'CAUTION: INCREASED WAVE TURBULENCE & THERMAL INVERSION' : 'FAVORABLE FISHING CONDITIONS IN SECTOR'}</span>
          </span>
          <span className="flex items-center gap-2 opacity-70">
            <span className="text-base sm:text-lg">•</span> 
            <span>ARGO SATELLITE TELEMETRY LINK ACTIVE • LOCALIZED INFERENCE READY (OFFLINE MODE ENABLED)</span>
          </span>
          <span className="flex items-center gap-2 hidden md:flex">
            <span className="text-base sm:text-lg">⚓</span> 
            <span>HARBOR: {selectedPort.name.toUpperCase()} ({selectedPort.basin})</span>
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#020617] py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FloatChat • AI-Powered ARGO Ocean Intelligence & Fishermen Early Risk Advisory</span>
          <span>Data Grounded in ARGO Global Float Array & Gemini Marine Intelligence</span>
        </div>
      </footer>

    </div>
  );
}
