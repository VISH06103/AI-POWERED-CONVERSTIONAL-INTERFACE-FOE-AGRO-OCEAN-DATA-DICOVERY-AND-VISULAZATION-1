import React, { useState, useMemo } from 'react';
import { 
  Anchor, 
  Compass, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  LifeBuoy,
  Waves,
  Ship,
  ChevronRight,
  Globe
} from 'lucide-react';
import { BoatType, UserProfile } from '../types';
import { COASTAL_STATES, COASTAL_VILLAGES, DEMO_CAPTAINS } from '../data/coastalVillages';

interface LoginPageProps {
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onContinueGuest: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLogin,
  onContinueGuest,
  isOffline,
  onToggleOffline
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'demo'>('form');
  
  // Core 4 Fields
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [selectedState, setSelectedState] = useState(currentUser?.state || 'Tamil Nadu');
  const [villageQuery, setVillageQuery] = useState(currentUser?.villageOrPort || 'Kasimedu Fishing Harbor');

  // Secondary/Optional Fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [boatName, setBoatName] = useState(currentUser?.boatName || 'Ocean Pioneer');
  const [boatRegNumber, setBoatRegNumber] = useState(currentUser?.boatRegNumber || '');
  const [boatType, setBoatType] = useState<BoatType>(currentUser?.boatType || 'Motorized Trawler');
  const [language, setLanguage] = useState(currentUser?.language || 'ta');
  const [crewCount, setCrewCount] = useState<number>(currentUser?.crewMembersCount || 4);
  const [rememberMe, setRememberMe] = useState(true);

  // Form Validation & Feedback
  const [errors, setErrors] = useState<{ name?: string; phone?: string; village?: string }>({});

  // Filtered villages for current state
  const stateVillages = useMemo(() => {
    return COASTAL_VILLAGES.filter(v => v.state === selectedState);
  }, [selectedState]);

  // Current selected state metadata
  const currentStateObj = useMemo(() => {
    return COASTAL_STATES.find(s => s.name === selectedState) || COASTAL_STATES[0];
  }, [selectedState]);

  const validateForm = () => {
    const errs: { name?: string; phone?: string; village?: string } = {};
    if (!name.trim()) {
      errs.name = 'Please enter your name or captain callsign';
    }
    if (!villageQuery.trim()) {
      errs.village = 'Please enter your coastal village or home port';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanName = name.trim();
    const cleanPhone = phone.trim() ? (phone.startsWith('+91') ? phone.trim() : `+91 ${phone.replace(/^\+?91/, '').trim()}`) : '+91 98400 12345';
    const cleanVillage = villageQuery.trim();

    const profile: UserProfile = {
      id: currentUser?.id || `user-${Date.now()}`,
      name: cleanName,
      phone: cleanPhone,
      boatName: boatName.trim() || 'Coastal Scout',
      boatRegNumber: boatRegNumber.trim() || `IND-${selectedState.substring(0, 2).toUpperCase()}-01-F-${Math.floor(1000 + Math.random() * 9000)}`,
      boatType,
      state: selectedState,
      villageOrPort: cleanVillage,
      language,
      isLoggedIn: true,
      crewMembersCount: crewCount,
      createdAt: currentUser?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    if (rememberMe) {
      try {
        localStorage.setItem('floatchat_user_profile', JSON.stringify(profile));
      } catch (err) {
        console.warn('Local storage error:', err);
      }
    }

    onLogin(profile);
  };

  const handleSelectDemoCaptain = (cap: UserProfile) => {
    try {
      localStorage.setItem('floatchat_user_profile', JSON.stringify(cap));
    } catch (err) {
      console.warn('Local storage error:', err);
    }
    onLogin(cap);
  };

  return (
    <div id="login-onboarding-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-6 sm:py-10 selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-blue-900/20 via-sky-900/5 to-transparent blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-xl z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-2.5 shadow-xl shadow-blue-950">
            <Anchor className="w-7 h-7 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>FloatChat</span>
            <span className="text-[11px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-300 border border-blue-500/40">
              AI MARITIME
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Real-time ARGO ocean intelligence, cyclone safety & live village coastal tracking
          </p>
        </div>

        {/* Network & Sea Offline Status Bar */}
        <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isOffline ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'}`}>
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">
                {isOffline ? 'Offline Sea Mode' : 'Online Satellite Network'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isOffline ? 'Using local physics engine & cached buoys' : 'Live Gemini AI & INCOIS satellite telemetry'}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="toggle-offline-btn"
            onClick={onToggleOffline}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isOffline
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isOffline ? 'Switch Online' : 'Test Offline'}
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 p-1.5 gap-1.5 bg-slate-950/60">
            <button
              type="button"
              id="tab-form-btn"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Enter Details Form</span>
            </button>
            <button
              type="button"
              id="tab-demo-btn"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'demo'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>1-Click Captains</span>
            </button>
          </div>

          {/* TAB 1: Core Dashboard Form */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4 text-left">
              
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" />
                  Captain & Village Profile
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Step 1 of 1</span>
              </div>

              {/* 1. User Name */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>User / Captain Name *</span>
                  </span>
                  {errors.name && <span className="text-[10px] text-rose-400 font-medium">{errors.name}</span>}
                </label>
                <input
                  type="text"
                  id="input-user-name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Captain Ramesh / Anbu / Sunil"
                  className={`w-full bg-slate-950 border ${errors.name ? 'border-rose-500' : 'border-slate-700/80'} rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
                />
              </div>

              {/* 2. Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mobile Number</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">For VHF / SOS SMS Alerts</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    id="input-mobile-number"
                    value={phone.replace(/^\+?91\s*/, '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9\s-]/g, '');
                      setPhone(val);
                    }}
                    placeholder="98401 23456"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-14 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* 3. Coastal State */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Coastal State *</span>
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">
                    {currentStateObj.basin}
                  </span>
                </label>
                <select
                  id="select-coastal-state"
                  value={selectedState}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setSelectedState(newState);
                    const matching = COASTAL_VILLAGES.filter(v => v.state === newState);
                    if (matching.length > 0) {
                      setVillageQuery(matching[0].name);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  {COASTAL_STATES.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.nativeName}) — {s.basin}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Coastal Village / Harbor */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Coastal Village / Port *</span>
                  </span>
                  {errors.village && <span className="text-[10px] text-rose-400 font-medium">{errors.village}</span>}
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    id="input-coastal-village"
                    required
                    value={villageQuery}
                    onChange={(e) => {
                      setVillageQuery(e.target.value);
                      if (errors.village) setErrors(prev => ({ ...prev, village: undefined }));
                    }}
                    placeholder="e.g. Kasimedu, Dhanushkodi, Vizhinjam, Malpe, Veraval..."
                    list="villages-auto-list"
                    className={`w-full bg-slate-950 border ${errors.village ? 'border-rose-500' : 'border-slate-700/80'} rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
                  />
                  <datalist id="villages-auto-list">
                    {stateVillages.map(v => (
                      <option key={v.id} value={v.name}>
                        {v.nativeName} ({v.district})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Quick Village Chips for Selected State */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {stateVillages.slice(0, 4).map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVillageQuery(v.name)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        villageQuery === v.name
                          ? 'bg-blue-600 text-white border-blue-400 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {v.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced / Optional Accordion */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-semibold transition-colors"
                >
                  <Ship className="w-3.5 h-3.5 text-blue-400" />
                  <span>{showAdvanced ? 'Hide Vessel & Language Settings' : '+ Add Vessel & Preferred Language (Optional)'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Boat / Vessel Name
                        </label>
                        <input
                          type="text"
                          value={boatName}
                          onChange={(e) => setBoatName(e.target.value)}
                          placeholder="e.g. Kadalarasan-IV"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Vessel Type
                        </label>
                        <select
                          value={boatType}
                          onChange={(e) => setBoatType(e.target.value as BoatType)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="Motorized Trawler">Motorized Trawler</option>
                          <option value="Artisanal Catamaran / FRP">Artisanal Catamaran / FRP</option>
                          <option value="Deep-Sea Longliner & Gillnetter">Deep-Sea Gillnetter</option>
                          <option value="Traditional Canoe / Dinghy">Traditional Canoe</option>
                          <option value="Coastal Patrol / Guard Craft">Patrol Craft</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-blue-400" />
                          <span>Voice Language / மொழி</span>
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="ta">Tamil (தமிழ்)</option>
                          <option value="te">Telugu (తెలుగు)</option>
                          <option value="ml">Malayalam (മലയാളം)</option>
                          <option value="kn">Kannada (ಕನ್ನಡ)</option>
                          <option value="gu">Gujarati (ગુજરાતી)</option>
                          <option value="mr">Marathi (मराठी)</option>
                          <option value="bn">Bengali (বাংলা)</option>
                          <option value="or">Odia (ଓଡ଼ିଆ)</option>
                          <option value="hi">Hindi (हिन्दी)</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Crew Members Count
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={35}
                          value={crewCount}
                          onChange={(e) => setCrewCount(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkbox: Remember profile offline */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Save profile locally for offline sea voyages
                  </span>
                </label>

                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>On-Device Safe</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  id="btn-launch-dashboard"
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all active:scale-[0.99]"
                >
                  <span>Open Dashboard & Track Live Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  id="btn-guest-access"
                  onClick={onContinueGuest}
                  className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-all"
                >
                  Quick Guest Access
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: 1-Click Demo Profiles */}
          {activeTab === 'demo' && (
            <div className="p-5 sm:p-7 space-y-3 text-left">
              <p className="text-xs text-slate-400 mb-1">
                Choose any pre-configured Indian coastal captain to instantly preview live ocean tracking:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_CAPTAINS.map(cap => (
                  <div
                    key={cap.id}
                    onClick={() => handleSelectDemoCaptain(cap)}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-blue-500 hover:bg-slate-900/80 cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {cap.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800">
                          {cap.state}
                        </span>
                      </div>

                      <div className="mt-2 space-y-0.5 text-[11px] text-slate-400 font-mono">
                        <p className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{cap.villageOrPort}</span>
                        </p>
                        <p className="flex items-center gap-1 text-slate-400">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{cap.phone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                      <span className="text-xs text-blue-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Launch <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">All demo profiles include pre-cached ARGO ocean telemetry</span>
                <button
                  type="button"
                  onClick={onContinueGuest}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Guest Access
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-5 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />
            Coastal Fishermen Safety Network
          </span>
          <span>•</span>
          <span>ARGO Ocean Buoys</span>
          <span>•</span>
          <span>INCOIS Telemetry</span>
        </div>

      </div>
    </div>
  );
};

