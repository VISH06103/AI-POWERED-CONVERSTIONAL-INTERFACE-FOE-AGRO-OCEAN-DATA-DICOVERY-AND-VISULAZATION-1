import { ArgoFloat, CoastalPort, DepthProfilePoint, SimulationPreset } from '../types';
import { calculateD26, calculateDistanceKm, calculateMLD, calculateTCHP, evaluateOceanRisk } from '../utils/oceanPhysics';

/**
 * Generates synthetic realistic vertical CTD profile from 0 to 2000m
 */
function generateRealisticProfile(
  sst: number,
  surfaceSal: number,
  d26TargetDepth: number,
  deepTemp: number = 2.4
): DepthProfilePoint[] {
  const depths = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];
  return depths.map(depth => {
    // Temperature profile with sharp thermocline
    let temp = sst;
    if (depth <= 20) {
      temp = sst - (depth / 20) * 0.15;
    } else if (depth <= d26TargetDepth) {
      // Warm mixed layer down to D26
      const ratio = (depth - 20) / Math.max(1, d26TargetDepth - 20);
      temp = (sst - 0.15) - ratio * ((sst - 0.15) - 26.0);
    } else if (depth <= 250) {
      // Main thermocline steep drop
      const ratio = (depth - d26TargetDepth) / (250 - d26TargetDepth);
      temp = 26.0 - ratio * (26.0 - 13.5);
    } else if (depth <= 1000) {
      const ratio = (depth - 250) / 750;
      temp = 13.5 - ratio * (13.5 - 5.5);
    } else {
      const ratio = (depth - 1000) / 1000;
      temp = 5.5 - ratio * (5.5 - deepTemp);
    }

    // Salinity profile (halocline: fresher at surface in Bay of Bengal/monsoon, saltier around 100m, stable in deep ocean)
    let salinity = surfaceSal;
    if (depth <= 100) {
      salinity = surfaceSal + (depth / 100) * 1.8;
    } else if (depth <= 500) {
      salinity = Math.min(35.5, surfaceSal + 1.8 - ((depth - 100) / 400) * 0.4);
    } else {
      salinity = 34.75 + (depth / 2000) * 0.15;
    }

    // Pressure in dbar ~ depth in meters * 1.01
    const pressure = Math.round(depth * 1.019716 * 10) / 10;

    // Density approx (sigma-t) kg/m³
    const density = Math.round((1024 + (depth * 0.0045) + (salinity - 35) * 0.78 - (temp - 10) * 0.22) * 10) / 10;

    // Sound speed approx (Mackenzie 1981) m/s
    const soundSpeed = Math.round(
      1448.96 + 4.591 * temp - 0.05304 * Math.pow(temp, 2) + 1.34 * (salinity - 35) + 0.0163 * depth
    );

    return {
      depth,
      temp: Math.round(temp * 100) / 100,
      salinity: Math.round(salinity * 100) / 100,
      pressure,
      density,
      soundSpeed,
    };
  });
}

// Initial Base ARGO Floats
export const BASE_ARGO_FLOATS: ArgoFloat[] = [
  {
    id: 'argo-2903345',
    wmoId: '2903345',
    name: 'INCOIS Bio-Argo Alpha (Bay of Bengal)',
    basin: 'Bay of Bengal',
    lat: 13.85,
    lng: 83.42,
    cycleNumber: 142,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    surfaceTemp: 30.6,
    surfaceSalinity: 32.8,
    surfacePressure: 5.2,
    tchp: 88.4,
    d26Depth: 82.5,
    mld: 42,
    sstAnomaly: 2.3,
    waveHeight: 3.8,
    windSpeedKnots: 38,
    riskLevel: 'HIGH_RISK',
    riskCategory: 'CYCLONE_HEAT_BUILDUP',
    alertSummary: 'Severe Cyclone Heat Pool: Exceptionally deep 30°C warm pool (TCHP 88 kJ/cm²). Rapid storm development underway.',
    localWarningNotice: 'Extreme Danger. Active cyclonic energy pool detected 180km East of Andhra coast. Fishermen halt all sailing.',
    profilePoints: generateRealisticProfile(30.6, 32.8, 82.5),
    batteryPercent: 88,
    transmissionStatus: 'LIVE',
  },
  {
    id: 'argo-2903562',
    wmoId: '2903562',
    name: 'INCOIS Deep Float (Off Chennai)',
    basin: 'Bay of Bengal',
    lat: 12.95,
    lng: 81.65,
    cycleNumber: 98,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    surfaceTemp: 29.4,
    surfaceSalinity: 33.4,
    surfacePressure: 4.8,
    tchp: 58.2,
    d26Depth: 62.0,
    mld: 35,
    sstAnomaly: 1.4,
    waveHeight: 2.6,
    windSpeedKnots: 24,
    riskLevel: 'MODERATE_RISK',
    riskCategory: 'ROUGH_SWELL',
    alertSummary: 'Moderate Cyclone Heat Potential: Swell building up to 2.6m with moderate thermocline energy.',
    localWarningNotice: 'Caution required for artisanal craft. Wind gusts expected up to 25 knots towards evening.',
    profilePoints: generateRealisticProfile(29.4, 33.4, 62.0),
    batteryPercent: 74,
    transmissionStatus: 'LIVE',
  },
  {
    id: 'argo-2903421',
    wmoId: '2903421',
    name: 'Arabian Sea Sentinel (Off Kochi)',
    basin: 'Arabian Sea',
    lat: 9.85,
    lng: 75.25,
    cycleNumber: 215,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    surfaceTemp: 28.3,
    surfaceSalinity: 35.8,
    surfacePressure: 4.1,
    tchp: 26.5,
    d26Depth: 34.0,
    mld: 28,
    sstAnomaly: 0.2,
    waveHeight: 1.4,
    windSpeedKnots: 12,
    riskLevel: 'LOW_RISK',
    riskCategory: 'SAFE_FISHING',
    alertSummary: 'Calm & Stable Waters: Normal thermocline, optimal mixed layer with strong upwelling chlorophyll proxy.',
    localWarningNotice: 'Safe conditions across Cochin coastal waters. Favorable sea state for all fishing vessels.',
    profilePoints: generateRealisticProfile(28.3, 35.8, 34.0),
    batteryPercent: 92,
    transmissionStatus: 'LIVE',
  },
  {
    id: 'argo-2903712',
    wmoId: '2903712',
    name: 'Konkan Coast Buoy (Off Mumbai)',
    basin: 'Arabian Sea',
    lat: 18.72,
    lng: 71.85,
    cycleNumber: 178,
    timestamp: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    surfaceTemp: 28.7,
    surfaceSalinity: 36.1,
    surfacePressure: 5.0,
    tchp: 38.0,
    d26Depth: 42.0,
    mld: 30,
    sstAnomaly: 0.6,
    waveHeight: 1.7,
    windSpeedKnots: 15,
    riskLevel: 'LOW_RISK',
    riskCategory: 'SAFE_FISHING',
    alertSummary: 'Favorable Sea Conditions: Mild northwesterly breeze, stable thermal structure.',
    localWarningNotice: 'Safe for Sassoon Dock and Versova fleets. Normal seasonal fishing zone active.',
    profilePoints: generateRealisticProfile(28.7, 36.1, 42.0),
    batteryPercent: 81,
    transmissionStatus: 'LIVE',
  },
  {
    id: 'argo-2903671',
    wmoId: '2903671',
    name: 'North Bay Bengal Buoy (Off Paradip)',
    basin: 'Bay of Bengal',
    lat: 19.82,
    lng: 87.45,
    cycleNumber: 84,
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    surfaceTemp: 30.1,
    surfaceSalinity: 31.2,
    surfacePressure: 6.1,
    tchp: 74.5,
    d26Depth: 74.0,
    mld: 38,
    sstAnomaly: 1.9,
    waveHeight: 3.2,
    windSpeedKnots: 32,
    riskLevel: 'HIGH_RISK',
    riskCategory: 'CYCLONE_HEAT_BUILDUP',
    alertSummary: 'Severe Cyclone Alert: Thermal heat energy high. Fresh water cap trapping heat below surface.',
    localWarningNotice: 'Danger Signal #3 recommended. Low pressure area deepening rapidly in North Bay.',
    profilePoints: generateRealisticProfile(30.1, 31.2, 74.0),
    batteryPercent: 69,
    transmissionStatus: 'LIVE',
  },
  {
    id: 'argo-2902990',
    wmoId: '2902990',
    name: 'Andaman Sea Deep Profiler',
    basin: 'Bay of Bengal',
    lat: 11.45,
    lng: 92.95,
    cycleNumber: 310,
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    surfaceTemp: 29.8,
    surfaceSalinity: 33.1,
    surfacePressure: 5.5,
    tchp: 66.8,
    d26Depth: 68.0,
    mld: 40,
    sstAnomaly: 1.6,
    waveHeight: 2.8,
    windSpeedKnots: 26,
    riskLevel: 'HIGH_RISK',
    riskCategory: 'CYCLONE_HEAT_BUILDUP',
    alertSummary: 'High Thermal Reservoir: Andaman trough accumulating massive convective heat.',
    localWarningNotice: 'Fishermen in Port Blair and Diglipur advised not to venture past 15nm eastward.',
    profilePoints: generateRealisticProfile(29.8, 33.1, 68.0),
    batteryPercent: 85,
    transmissionStatus: 'LIVE',
  },
  {
    id: 'argo-2903109',
    wmoId: '2903109',
    name: 'Saurashtra Oceanic Buoy (Veraval)',
    basin: 'Arabian Sea',
    lat: 20.45,
    lng: 69.80,
    cycleNumber: 154,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    surfaceTemp: 27.8,
    surfaceSalinity: 36.4,
    surfacePressure: 4.3,
    tchp: 19.5,
    d26Depth: 26.0,
    mld: 24,
    sstAnomaly: -0.2,
    waveHeight: 1.3,
    windSpeedKnots: 11,
    riskLevel: 'LOW_RISK',
    riskCategory: 'SAFE_FISHING',
    alertSummary: 'Calm Sea State: Strong coastal upwelling with rich pelagic fish aggregations.',
    localWarningNotice: 'Favorable fishing conditions for Veraval and Porbandar trawlers.',
    profilePoints: generateRealisticProfile(27.8, 36.4, 26.0),
    batteryPercent: 94,
    transmissionStatus: 'LIVE',
  },
  {
    id: 'argo-5904512',
    wmoId: '5904512',
    name: 'South China Sea / Luzon Strait Float',
    basin: 'South China Sea',
    lat: 17.50,
    lng: 118.20,
    cycleNumber: 112,
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    surfaceTemp: 30.2,
    surfaceSalinity: 34.2,
    surfacePressure: 5.7,
    tchp: 79.2,
    d26Depth: 76.0,
    mld: 44,
    sstAnomaly: 1.8,
    waveHeight: 3.4,
    windSpeedKnots: 34,
    riskLevel: 'HIGH_RISK',
    riskCategory: 'CYCLONE_HEAT_BUILDUP',
    alertSummary: 'Typhoon Fuel Zone: High TCHP and deep warm pool east of Luzon and Vietnam.',
    localWarningNotice: 'Typhoon precursor heat pocket active. Coastal fishing craft seek sheltered anchorage.',
    profilePoints: generateRealisticProfile(30.2, 34.2, 76.0),
    batteryPercent: 77,
    transmissionStatus: 'LIVE',
  },
];

// Major Coastal Fishing Ports
export const COASTAL_PORTS: CoastalPort[] = [
  {
    id: 'port-visakhapatnam',
    name: 'Visakhapatnam Fishing Harbor',
    nativeName: 'విశాఖపట్నం ఫిషింగ్ హార్బర్',
    country: 'India',
    state: 'Andhra Pradesh',
    basin: 'Bay of Bengal',
    lat: 17.6868,
    lng: 83.2185,
    primaryLanguage: 'te',
    coastGuardContact: '+91-891-2563721 / Toll Free: 1554',
    vhfChannel: 'Ch 16 / 68',
    currentWarningStatus: 'HIGH_RISK',
    activeBoatsCount: 420,
  },
  {
    id: 'port-chennai-kasimedu',
    name: 'Chennai (Kasimedu Harbor)',
    nativeName: 'சென்னை காசிமேடு மீன்பிடி துறைமுகம்',
    country: 'India',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 13.1256,
    lng: 80.2974,
    primaryLanguage: 'ta',
    coastGuardContact: '+91-44-25951234 / Toll Free: 1554',
    vhfChannel: 'Ch 16 / 72',
    currentWarningStatus: 'MODERATE_RISK',
    activeBoatsCount: 650,
  },
  {
    id: 'port-kochi',
    name: 'Kochi (Munambam & Thoppumpady)',
    nativeName: 'കൊച്ചി മുനമ്പം ഹാർബർ',
    country: 'India',
    state: 'Kerala',
    basin: 'Arabian Sea',
    lat: 9.9312,
    lng: 76.2673,
    primaryLanguage: 'ml',
    coastGuardContact: '+91-484-2216543 / Toll Free: 1554',
    vhfChannel: 'Ch 16 / 69',
    currentWarningStatus: 'LOW_RISK',
    activeBoatsCount: 510,
  },
  {
    id: 'port-mumbai-sassoon',
    name: 'Mumbai (Sassoon Dock & Versova)',
    nativeName: 'मुंबई ससून डॉक',
    country: 'India',
    state: 'Maharashtra',
    basin: 'Arabian Sea',
    lat: 18.9168,
    lng: 72.8228,
    primaryLanguage: 'mr',
    coastGuardContact: '+91-22-22661234 / Toll Free: 1554',
    vhfChannel: 'Ch 16 / 74',
    currentWarningStatus: 'LOW_RISK',
    activeBoatsCount: 780,
  },
  {
    id: 'port-veraval',
    name: 'Veraval Fishing Harbor',
    nativeName: 'વેરાવળ ફિશિંગ હાર્બર',
    country: 'India',
    state: 'Gujarat',
    basin: 'Arabian Sea',
    lat: 20.9077,
    lng: 70.3678,
    primaryLanguage: 'gu',
    coastGuardContact: '+91-2876-241234 / Toll Free: 1554',
    vhfChannel: 'Ch 16 / 71',
    currentWarningStatus: 'LOW_RISK',
    activeBoatsCount: 890,
  },
  {
    id: 'port-paradip',
    name: 'Paradip Fishing Port',
    nativeName: 'ପାରାଦୀପ ମତ୍ସ୍ୟ ବନ୍ଦର',
    country: 'India',
    state: 'Odisha',
    basin: 'Bay of Bengal',
    lat: 20.2644,
    lng: 86.6877,
    primaryLanguage: 'bn',
    coastGuardContact: '+91-6722-222345 / Toll Free: 1554',
    vhfChannel: 'Ch 16 / 67',
    currentWarningStatus: 'HIGH_RISK',
    activeBoatsCount: 380,
  },
  {
    id: 'port-port-blair',
    name: 'Port Blair (Junglighat Jetty)',
    nativeName: 'पोर्ट ब्लेयर (जंगलीघाट)',
    country: 'India',
    state: 'Andaman & Nicobar',
    basin: 'Bay of Bengal',
    lat: 11.6670,
    lng: 92.7350,
    primaryLanguage: 'hi',
    coastGuardContact: '+91-3192-232145 / Toll Free: 1554',
    vhfChannel: 'Ch 16 / 73',
    currentWarningStatus: 'HIGH_RISK',
    activeBoatsCount: 190,
  },
  {
    id: 'port-chittagong',
    name: 'Chittagong Fishery Ghat',
    nativeName: 'চট্টগ্রাম ফিশারি ঘাট',
    country: 'Bangladesh',
    state: 'Chittagong',
    basin: 'Bay of Bengal',
    lat: 22.3350,
    lng: 91.8325,
    primaryLanguage: 'bn',
    coastGuardContact: '+880-31-610123 / Ch 16',
    vhfChannel: 'Ch 16 / 68',
    currentWarningStatus: 'HIGH_RISK',
    activeBoatsCount: 620,
  },
  {
    id: 'port-colombo',
    name: 'Colombo & Mutwal Harbor',
    nativeName: 'කොළඹ වරාය',
    country: 'Sri Lanka',
    basin: 'Indian Ocean',
    lat: 6.9450,
    lng: 79.8550,
    primaryLanguage: 'ta',
    coastGuardContact: '+94-11-2441234 / Ch 16',
    vhfChannel: 'Ch 16 / 70',
    currentWarningStatus: 'LOW_RISK',
    activeBoatsCount: 340,
  },
];

// Pre-computed Simulation Presets to test and demo the AI warning system
export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'sim-live-real',
    title: 'Live ARGO Telemetry Feed',
    description: 'Current real-time ocean observations from the international ARGO float network.',
    basin: 'All Basins',
    tempDelta: 0,
    tchpDelta: 0,
    waveDelta: 0,
    riskLevel: 'HIGH_RISK',
    badge: 'LIVE SATELLITE',
  },
  {
    id: 'sim-super-cyclone',
    title: 'Super Cyclone Rapid Intensification',
    description: 'Simulates severe thermal buildup: D26 pushes to 95m, TCHP spikes above 95 kJ/cm², waves surge to 4.5m.',
    basin: 'Bay of Bengal & South China Sea',
    tempDelta: 1.8,
    tchpDelta: 35,
    waveDelta: 1.8,
    riskLevel: 'HIGH_RISK',
    badge: 'SEVERE SIMULATION',
  },
  {
    id: 'sim-monsoon-swell',
    title: 'Monsoon Sea Surge & Swells',
    description: 'Moderate surface wave turbulence with cooler thermocline upwelling near Western Ghats.',
    basin: 'Arabian Sea',
    tempDelta: -0.5,
    tchpDelta: 10,
    waveDelta: 1.2,
    riskLevel: 'MODERATE_RISK',
    badge: 'SWELL ALERT',
  },
  {
    id: 'sim-calm-window',
    title: 'Calm Sea - Golden Fishing Window',
    description: 'Benign ocean weather, low wave activity, balanced nutrients, ideal conditions for deep-sea fleets.',
    basin: 'All Basins',
    tempDelta: -0.8,
    tchpDelta: -25,
    waveDelta: -1.5,
    riskLevel: 'LOW_RISK',
    badge: 'CALM WATERS',
  },
];

/**
 * Enriches ARGO floats with proximity to coastal ports
 */
export function getEnrichedFloats(floats: ArgoFloat[] = BASE_ARGO_FLOATS): ArgoFloat[] {
  return floats.map(float => {
    let minDistance = Infinity;
    let closestPortName = 'Open Ocean';

    for (const port of COASTAL_PORTS) {
      const dist = calculateDistanceKm(float.lat, float.lng, port.lat, port.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestPortName = port.name;
      }
    }

    return {
      ...float,
      nearestPortDistanceKm: minDistance,
      nearestPortName: closestPortName,
    };
  });
}
