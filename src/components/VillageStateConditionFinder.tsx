import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Compass, 
  Waves, 
  Flame, 
  Thermometer, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  Anchor, 
  ArrowRight, 
  Navigation,
  Sparkles,
  Wifi,
  WifiOff,
  Fish,
  Route,
  ShieldAlert,
  Layers,
  ChevronRight,
  TrendingUp,
  Droplets,
  LifeBuoy,
  Activity,
  RotateCcw
} from 'lucide-react';
import { ArgoFloat, CoastalVillage, VillageConditionResult } from '../types';
import { COASTAL_STATES, COASTAL_VILLAGES, INDIAN_AND_GLOBAL_PLACES_DIRECTORY, identifyVillageOrStateCondition } from '../data/coastalVillages';

interface VillageStateConditionFinderProps {
  floats: ArgoFloat[];
  isOffline: boolean;
  onSelectFloat: (fl: ArgoFloat) => void;
  onOpenDepthProfile?: (fl: ArgoFloat) => void;
  onSetActiveLocation?: (villageResult: VillageConditionResult) => void;
  initialQuery?: string;
  compassHeading?: number;
}

export const VillageStateConditionFinder: React.FC<VillageStateConditionFinderProps> = ({
  floats,
  isOffline,
  onSelectFloat,
  onOpenDepthProfile,
  onSetActiveLocation,
  initialQuery = 'Tumakuru (Tumkur)',
  compassHeading,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<VillageConditionResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'CONDITIONS' | 'TRACK' | 'BIODATA'>('CONDITIONS');

  // Identify condition on initial mount or when query changes
  useEffect(() => {
    if (query.trim()) {
      handleIdentify(query);
    }
  }, [floats, isOffline]);

  const handleIdentify = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    const cleanQ = searchQuery.trim();

    // 1. First run instant offline/local deterministic resolution
    const localRes = identifyVillageOrStateCondition(cleanQ, floats, isOffline);

    // 2. If online and it was a custom unlisted place without exact coords, attempt quick Nominatim geocode
    if (!isOffline && localRes.isCustomGeocoded && typeof window !== 'undefined' && window.navigator.onLine) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 700);

        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQ)}&format=json&limit=1`,
          {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          }
        );
        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = await resp.json();
          if (data && data.length > 0) {
            const hit = data[0];
            const fetchedLat = parseFloat(hit.lat);
            const fetchedLng = parseFloat(hit.lon);

            if (!isNaN(fetchedLat) && !isNaN(fetchedLng)) {
              // Re-run identifier with resolved GPS coordinates
              const geoResolved = identifyVillageOrStateCondition(`${fetchedLat.toFixed(4)}, ${fetchedLng.toFixed(4)}`, floats, false);
              geoResolved.villageName = hit.display_name?.split(',')[0] || cleanQ;
              geoResolved.district = hit.display_name?.split(',')[1]?.trim() || localRes.district;
              setResult(geoResolved);
              setIsSearching(false);
              return;
            }
          }
        }
      } catch {
        // Fall back gracefully to local engine
      }
    }

    setResult(localRes);
    setIsSearching(false);
  };

  const handleQuickChip = (villageName: string) => {
    setQuery(villageName);
    handleIdentify(villageName);
  };

  // Text-to-speech for regional advisory with multi-lingual voice detection
  const handleSpeakAdvisory = (text: string, stateName: string = '') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Detect language code
    if (stateName.includes('Karnataka')) {
      utterance.lang = 'kn-IN';
    } else if (stateName.includes('Tamil')) {
      utterance.lang = 'ta-IN';
    } else if (stateName.includes('Kerala')) {
      utterance.lang = 'ml-IN';
    } else if (stateName.includes('Andhra') || stateName.includes('Telangana')) {
      utterance.lang = 'te-IN';
    } else if (stateName.includes('Maharashtra')) {
      utterance.lang = 'mr-IN';
    } else if (stateName.includes('Gujarat')) {
      utterance.lang = 'gu-IN';
    } else if (stateName.includes('Bengal')) {
      utterance.lang = 'bn-IN';
    } else if (stateName.includes('Odisha')) {
      utterance.lang = 'or-IN';
    } else {
      utterance.lang = 'hi-IN';
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const quickPills = [
    { label: 'Tumkur / Tumakuru', query: 'Tumkur' },
    { label: 'Malpe (Udupi)', query: 'Malpe' },
    { label: 'Kasimedu (Chennai)', query: 'Kasimedu' },
    { label: 'Dhanushkodi (Rameswaram)', query: 'Dhanushkodi' },
    { label: 'Vizhinjam (Kerala)', query: 'Vizhinjam' },
    { label: 'Jalaripeta (Vizag)', query: 'Jalaripeta' },
    { label: 'Digha (West Bengal)', query: 'Digha' },
    { label: 'Paradip (Odisha)', query: 'Paradip' },
    { label: 'Versova (Mumbai)', query: 'Versova' },
    { label: 'Veraval (Gujarat)', query: 'Veraval' },
    { label: 'Bengaluru (Bangalore)', query: 'Bengaluru' },
    { label: 'Karwar (Karnataka)', query: 'Karwar' },
  ];

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
      
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Location Condition, Track & Marine Biodata Identifier</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                Online / Offline Dual Core
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Search any village, town, district or inland city (e.g. Tumkur, Kasimedu, Malpe, Bangalore) to view linked ocean conditions, nautical tracks, and fish biodata.
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
            isOffline ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
          }`}>
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? 'Offline On-Device Engine' : 'Live Satellite Grounding'}</span>
          </span>
        </div>
      </div>

      {/* Search Input Bar */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleIdentify(query);
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter ANY place, village, district (e.g. Tumkur, Kasimedu, Malpe, Kerala, Pune, Digha...)"
            list="coastal-suggestions"
            className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
          <datalist id="coastal-suggestions">
            {INDIAN_AND_GLOBAL_PLACES_DIRECTORY.map(p => (
              <option key={p.id} value={`${p.name}, ${p.state}`} />
            ))}
            {COASTAL_VILLAGES.map(v => (
              <option key={v.id} value={`${v.name}, ${v.state}`} />
            ))}
            {COASTAL_STATES.map(s => (
              <option key={s.name} value={`${s.name} Coast`} />
            ))}
          </datalist>
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all shrink-0"
        >
          {isSearching ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Analyzing...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Identify & Track</span>
            </span>
          )}
        </button>
      </form>

      {/* Quick Search Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] text-slate-500 shrink-0 font-medium mr-1">Quick Places:</span>
        {quickPills.map(p => (
          <button
            key={p.query}
            type="button"
            onClick={() => handleQuickChip(p.query)}
            className={`px-3 py-1 rounded-xl text-[11px] font-medium shrink-0 border transition-all ${
              query.toLowerCase().includes(p.query.toLowerCase())
                ? 'bg-blue-600 text-white border-blue-400 font-bold shadow'
                : 'bg-[#020617] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Identification Result Box */}
      {result && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
          
          {/* Top Result Header Card */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            result.riskLevel === 'HIGH_RISK'
              ? 'bg-red-950/20 border-red-500/50 shadow-xl shadow-red-950/20'
              : result.riskLevel === 'MODERATE_RISK'
              ? 'bg-amber-950/20 border-amber-500/50 shadow-xl shadow-amber-950/20'
              : 'bg-emerald-950/20 border-emerald-500/50 shadow-xl shadow-emerald-950/20'
          }`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-blue-300">
                    {result.basin}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {result.district}, {result.state} ({result.lat.toFixed(2)}°N, {result.lng.toFixed(2)}°E)
                  </span>
                  {result.isInlandPlace && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Inland Place ({result.distanceToCoastKm} km to Coast)
                    </span>
                  )}
                  {result.isCustomGeocoded && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Smart Estimated
                    </span>
                  )}
                </div>

                <h4 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>{result.villageName}</span>
                  {result.matchedVillage && (
                    <span className="text-sm font-normal text-slate-400 font-sans">
                      ({result.matchedVillage.nativeName})
                    </span>
                  )}
                </h4>

                {result.nearestPortGateway && (
                  <div className="text-xs text-blue-300 mt-1 flex items-center gap-1.5 font-medium">
                    <Anchor className="w-3.5 h-3.5 text-blue-400" />
                    <span>Maritime Port Gateway: <strong>{result.nearestPortGateway}</strong></span>
                  </div>
                )}
              </div>

              {/* Recommendation Badge & Action */}
              <div className="flex flex-wrap items-center gap-2">
                <div className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg ${
                  result.recommendation === 'HAZARDOUS_DO_NOT_VENTURE'
                    ? 'bg-red-600 text-white shadow-red-900/40 animate-pulse'
                    : result.recommendation === 'CAUTION_NEAR_COAST'
                    ? 'bg-amber-500 text-slate-950 shadow-amber-900/40'
                    : 'bg-emerald-600 text-white shadow-emerald-900/40'
                }`}>
                  {result.recommendation === 'HAZARDOUS_DO_NOT_VENTURE' && <AlertTriangle className="w-4 h-4" />}
                  {result.recommendation === 'CAUTION_NEAR_COAST' && <AlertTriangle className="w-4 h-4" />}
                  {result.recommendation === 'SAFE_TO_SAIL' && <CheckCircle2 className="w-4 h-4" />}
                  <span>{result.recommendation.replace(/_/g, ' ')}</span>
                </div>

                {onSetActiveLocation && (
                  <button
                    type="button"
                    onClick={() => onSetActiveLocation(result)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/40 transition-all border border-blue-400/30"
                    title="Center on map and plot nautical corridor"
                  >
                    <Anchor className="w-3.5 h-3.5" />
                    <span>📍 Pin on Live Map</span>
                  </button>
                )}
              </div>
            </div>

            {/* Advisory Summary */}
            <p className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed">
              {result.advisorySummary}
            </p>

            {/* Regional Language Advisory Bar with Voice TTS */}
            <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                  {result.state.includes('Karnataka') ? 'ಪ್ರಾದೇಶಿಕ ಭಾಷಾ ಎಚ್ಚರಿಕೆ (ಕನ್ನಡ):' : 'Regional Advisory (வட்டார மொழி எச்சரிக்கை):'}
                </span>
                <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed">
                  "{result.nativeAdvisory}"
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSpeakAdvisory(result.nativeAdvisory, result.state)}
                className={`p-2 rounded-xl border transition-all shrink-0 ${
                  isSpeaking
                    ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700'
                }`}
                title="Listen to advisory audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-view Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('CONDITIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'CONDITIONS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Ocean Conditions & Buoy</span>
            </button>

            <button
              onClick={() => setActiveTab('TRACK')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'TRACK'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Location-Based Track & Corridors</span>
            </button>

            <button
              onClick={() => setActiveTab('BIODATA')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'BIODATA'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Fish className="w-3.5 h-3.5" />
              <span>Marine Biodata & PFZ Zones</span>
            </button>
          </div>

          {/* TAB 1: OCEAN CONDITIONS */}
          {activeTab === 'CONDITIONS' && (
            <div className="space-y-4">
              {/* Condition Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                
                {/* TCHP Box */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Flame className={`w-3 h-3 ${result.nearestFloat.tchp > 50 ? 'text-red-400' : 'text-amber-400'}`} />
                      TCHP Energy
                    </span>
                  </div>
                  <div className="my-1">
                    <span className={`text-xl font-bold font-mono ${result.nearestFloat.tchp > 50 ? 'text-red-400' : 'text-white'}`}>
                      {result.nearestFloat.tchp}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">kJ/cm²</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {result.nearestFloat.tchp > 50 ? 'Cyclone Risk' : 'Normal'}
                  </p>
                </div>

                {/* D26 Isotherm */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-blue-400" />
                      D26 Depth
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="text-xl font-bold font-mono text-white">
                      {result.nearestFloat.d26Depth}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">m</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    26°C Warm Pool
                  </p>
                </div>

                {/* Wave Swell */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Waves className="w-3 h-3 text-cyan-400" />
                      Wave Swell
                    </span>
                  </div>
                  <div className="my-1">
                    <span className={`text-xl font-bold font-mono ${result.nearestFloat.waveHeight >= 2.5 ? 'text-red-400' : 'text-white'}`}>
                      {result.nearestFloat.waveHeight}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">meters</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {result.nearestFloat.waveHeight >= 2.5 ? 'Rough Sea' : 'Moderate'}
                  </p>
                </div>

                {/* Wind Speed */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Wind className="w-3 h-3 text-slate-400" />
                      Wind Speed
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="text-xl font-bold font-mono text-white">
                      {result.nearestFloat.windSpeedKnots}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">knots</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Surface Gale
                  </p>
                </div>

                {/* Surface Temp */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-emerald-400" />
                      SST Temp
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="text-xl font-bold font-mono text-white">
                      {result.nearestFloat.surfaceTemp}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">°C</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Anomaly: +{result.nearestFloat.sstAnomaly}°C
                  </p>
                </div>

                {/* Safe Radius */}
                <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-blue-400" />
                      Safe Radius
                    </span>
                  </div>
                  <div className="my-1">
                    <span className={`text-xl font-bold font-mono ${result.safeDistanceNauticalMiles === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {result.safeDistanceNauticalMiles}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">NM</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {result.safeDistanceNauticalMiles === 0 ? 'No Sailing' : 'Max distance'}
                  </p>
                </div>

              </div>

              {/* Linked Float & CTD Link */}
              <div className="p-3.5 rounded-2xl bg-[#020617] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 font-mono">
                    ARGO #{result.nearestFloat.wmoId}
                  </span>
                  <span className="text-slate-400">
                    Stationed <strong>{result.distanceToFloatKm} km</strong> ({result.trackInfo.distanceNauticalMiles} NM) offshore at {result.trackInfo.compassDirection}.
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {onSetActiveLocation && (
                    <button
                      type="button"
                      onClick={() => onSetActiveLocation(result)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/30 transition-all"
                    >
                      <Anchor className="w-3.5 h-3.5" />
                      <span>Set Active Harbor</span>
                    </button>
                  )}

                  {onOpenDepthProfile && (
                    <button
                      type="button"
                      onClick={() => onOpenDepthProfile(result.nearestFloat)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>CTD Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION-BASED TRACK */}
          {activeTab === 'TRACK' && (
            <div className="space-y-4">
              {/* Track Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    Outbound Heading Vector
                  </span>
                  <div className="text-xl font-mono font-bold text-white">
                    {result.trackInfo.compassDirection}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    True Bearing: {result.trackInfo.bearingDegrees}°
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    Track Distance
                  </span>
                  <div className="text-xl font-mono font-bold text-white">
                    {result.trackInfo.distanceNauticalMiles} <span className="text-sm font-normal text-slate-400">NM</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {result.trackInfo.distanceKm} kilometers offshore
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    Emergency Return Course
                  </span>
                  <div className="text-xl font-mono font-bold text-emerald-400">
                    {result.trackInfo.safeReturnDirection}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Reciprocal back to shoreline
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
                    Refuge Shelter Harbor
                  </span>
                  <div className="text-sm font-bold text-white truncate">
                    {result.trackInfo.nearestRefugeHarbor}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Est. Transit: {result.trackInfo.estimatedTransitMinutes} min @ 10 kts
                  </p>
                </div>
              </div>

              {/* Waypoints Sequence List */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-blue-400" />
                  <span>Sequential Nautical Waypoint Corridors</span>
                </h5>

                <div className="space-y-2">
                  {result.trackInfo.waypoints.map((wp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          wp.type === 'PORT_ORIGIN' ? 'bg-blue-600 text-white' :
                          wp.type === 'PFZ_ZONE' ? 'bg-emerald-600 text-white' :
                          wp.type === 'BUOY_DESTINATION' ? 'bg-purple-600 text-white' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {idx}
                        </span>
                        <div>
                          <div className="font-bold text-white">{wp.label}</div>
                          <div className="text-[11px] text-slate-400">{wp.description}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px] text-cyan-400">
                        {wp.lat.toFixed(2)}°N, {wp.lng.toFixed(2)}°E
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARINE BIODATA & PFZ */}
          {activeTab === 'BIODATA' && (
            <div className="space-y-4">
              
              {/* PFZ Potential Card */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                result.biodata.pfzStatus === 'HIGH_POTENTIAL'
                  ? 'bg-emerald-950/40 border-emerald-500/50'
                  : result.biodata.pfzStatus === 'MODERATE_POTENTIAL'
                  ? 'bg-blue-950/40 border-blue-500/50'
                  : 'bg-amber-950/40 border-amber-500/50'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      result.biodata.pfzStatus === 'HIGH_POTENTIAL'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-blue-500 text-slate-950'
                    }`}>
                      {result.biodata.pfzStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      Chlorophyll: {result.biodata.chlorophyllMgM3} mg/m³ ({result.biodata.phytoplanktonIndex})
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 mt-2">
                    {result.biodata.pfzReason}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Optimum Catch Band</div>
                  <div className="text-base font-bold font-mono text-cyan-300">{result.biodata.optimumCatchDepth}</div>
                  <div className="text-[10px] text-slate-400">Thermocline: {result.biodata.thermoclineDepthMeters}m</div>
                </div>
              </div>

              {/* Physical Oceanographic Ecology Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Dissolved Oxygen</span>
                  <span className="text-sm font-bold text-white font-mono">{result.biodata.dissolvedOxygenMlPerL} ml/L</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Upwelling Status</span>
                  <span className="text-sm font-bold text-emerald-400">{result.biodata.upwellingStrength}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Halocline Salinity</span>
                  <span className="text-sm font-bold text-white font-mono">{result.biodata.salinityHaloclinePsu} PSU</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Seabed Topography</span>
                  <span className="text-sm font-bold text-amber-300 truncate block">{result.biodata.seabedStructure}</span>
                </div>
              </div>

              {/* Target Fish Species in Regional Names */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Fish className="w-4 h-4 text-emerald-400" />
                  <span>Target Commercial Species & Regional Vernacular</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.biodata.primarySpecies.map((sp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs sm:text-sm">{sp.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {sp.abundance}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-amber-300">
                        {sp.localName} <span className="text-[10px] text-slate-500 italic">({sp.scientificName})</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>Depth: <strong className="text-slate-200">{sp.optimalDepthRange}</strong></span>
                        <span>Gear: <strong className="text-cyan-300">{sp.suggestedGear}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
