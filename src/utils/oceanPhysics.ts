import { ArgoFloat, DepthProfilePoint, FishSpeciesBiodata, LocationTrackInfo, MarineBiodata, MobileSensorReading, OceanRiskAssessment, OceanRiskLevel, RegisteredRadioPacket, UserProfile } from '../types';

/**
 * Calculates initial compass bearing in degrees (0 to 360) between two coordinates
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  const bearing = (theta * 180) / Math.PI;

  return Math.round((bearing + 360) % 360);
}

/**
 * Converts degrees into 16-point cardinal compass string
 */
export function getCardinalDirection(degrees: number): string {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return cardinals[index];
}

/**
 * Computes nautical track, waypoints, return vectors and refuge harbors
 */
export function generateLocationTrack(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
  originName: string,
  targetName: string,
  state: string,
  basin: string
): LocationTrackInfo {
  const distanceKm = calculateDistanceKm(originLat, originLng, targetLat, targetLng);
  const distanceNauticalMiles = Math.round((distanceKm / 1.852) * 10) / 10;
  const bearingDegrees = calculateBearing(originLat, originLng, targetLat, targetLng);
  const compassDirection = `${bearingDegrees}° ${getCardinalDirection(bearingDegrees)}`;
  
  // Reciprocal return bearing back to shore (opposite heading)
  const safeReturnBearing = (bearingDegrees + 180) % 360;
  const safeReturnDirection = `${safeReturnBearing}° ${getCardinalDirection(safeReturnBearing)}`;

  // Transit time at typical coastal cruise speed of 10 knots
  const estimatedTransitMinutes = Math.round((distanceNauticalMiles / 10) * 60);

  // Generate tactical nautical waypoints along the vector
  const midLat = originLat + (targetLat - originLat) * 0.45;
  const midLng = originLng + (targetLng - originLng) * 0.45;

  const pfzLat = originLat + (targetLat - originLat) * 0.25;
  const pfzLng = originLng + (targetLng - originLng) * 0.25;

  const waypoints = [
    {
      lat: originLat,
      lng: originLng,
      label: `WP0: ${originName}`,
      description: `Coastal Departure Point (${originLat.toFixed(3)}°N, ${originLng.toFixed(3)}°E)`,
      type: 'PORT_ORIGIN' as const,
    },
    {
      lat: Number(pfzLat.toFixed(3)),
      lng: Number(pfzLng.toFixed(3)),
      label: 'WP1: Inshore Safe Line (6 NM)',
      description: 'Artisanal country craft boundary & primary gillnet zone',
      type: 'SAFE_CORRIDOR' as const,
    },
    {
      lat: Number(midLat.toFixed(3)),
      lng: Number(midLng.toFixed(3)),
      label: 'WP2: Potential Fishing Zone (PFZ)',
      description: 'Thermocline front & pelagic aggregation waypoint',
      type: 'PFZ_ZONE' as const,
    },
    {
      lat: targetLat,
      lng: targetLng,
      label: `WP3: ${targetName}`,
      description: `Offshore Profiler Telemetry Station (${distanceNauticalMiles} NM offshore)`,
      type: 'BUOY_DESTINATION' as const,
    },
  ];

  // Nearest refuge harbor based on region
  const nearestRefugeHarbor = originName.includes('Kasimedu') ? 'Chennai Harbor Basin'
    : originName.includes('Vizhinjam') ? 'Vizhinjam Breakwater Port'
    : originName.includes('Kochi') ? 'Munambam Fishing Harbor'
    : originName.includes('Jalaripeta') ? 'Visakhapatnam Inner Harbor'
    : originName.includes('Digha') ? 'Shankarpur Fishing Harbor'
    : originName.includes('Paradip') ? 'Mahanadi River Mouth Shelter'
    : originName.includes('Veraval') ? 'Veraval Deep Basin Shelter'
    : originName.includes('Versova') ? 'Sassoon Dock & Versova Creek'
    : `${originName} Coast Guard Base`;

  return {
    bearingDegrees,
    compassDirection,
    distanceKm,
    distanceNauticalMiles,
    estimatedTransitMinutes,
    safeReturnBearing,
    safeReturnDirection,
    nearestRefugeHarbor,
    nearestRefugeDistanceKm: Math.max(3, Math.round(distanceKm * 0.15)),
    waypoints,
  };
}

/**
 * Generates rich marine biodata & Potential Fishing Zone (PFZ) analytics
 */
export function generateMarineBiodata(
  lat: number,
  lng: number,
  float: ArgoFloat,
  villageName: string,
  state: string,
  basin: string
): MarineBiodata {
  // Chlorophyll proxy from SST and MLD
  const isOptimalTemp = float.surfaceTemp >= 27.5 && float.surfaceTemp <= 29.5;
  const isHealthyMld = float.mld >= 25 && float.mld <= 60;
  const isLowCycloneRisk = float.tchp < 45;

  let pfzStatus: 'HIGH_POTENTIAL' | 'MODERATE_POTENTIAL' | 'LOW_POTENTIAL' = 'MODERATE_POTENTIAL';
  let pfzReason = 'Moderate pelagic activity detected near thermocline boundary.';
  let chlorophyllMgM3 = 0.85;
  let phytoplanktonIndex: 'High Bloom' | 'Moderate Bloom' | 'Normal Oceanic' = 'Moderate Bloom';

  if (isOptimalTemp && isHealthyMld && isLowCycloneRisk) {
    pfzStatus = 'HIGH_POTENTIAL';
    chlorophyllMgM3 = 1.45;
    phytoplanktonIndex = 'High Bloom';
    pfzReason = `Strong thermal gradient front at ${float.mld}m depth creating high phytoplankton concentration and active pelagic shoals.`;
  } else if (float.riskLevel === 'HIGH_RISK') {
    pfzStatus = 'LOW_POTENTIAL';
    chlorophyllMgM3 = 0.35;
    phytoplanktonIndex = 'Normal Oceanic';
    pfzReason = 'Deep cyclonic heat reservoir disrupts nutrient upwelling; fish shoals scattered to deeper benthic layers.';
  }

  const dissolvedOxygenMlPerL = Number((4.6 - (float.surfaceTemp - 27) * 0.15).toFixed(2));
  const thermoclineDepthMeters = float.d26Depth > 0 ? float.d26Depth : 45;
  const optimumCatchDepth = `${Math.max(10, float.mld - 10)}m – ${Math.min(65, float.d26Depth + 15)}m`;

  const seabedStructure = lat > 18 ? 'Silty Muddy Continental Shelf (Rich Prawn/Hilsa Bed)'
    : lat < 10 ? 'Rocky Coral Outcrop & Deep Drop-off'
    : 'Sandy Sub-surface Ridge with Continental Slope';

  const upwellingStrength = float.sstAnomaly < 0 
    ? 'Strong Coastal Upwelling' 
    : isHealthyMld ? 'Moderate Upwelling' : 'Stratified Neutral';

  // Species mapping based on region & state
  let primarySpecies: FishSpeciesBiodata[] = [];

  if (state.includes('Tamil') || basin === 'Bay of Bengal') {
    primarySpecies = [
      {
        name: 'Seer Fish / King Mackerel',
        localName: 'வஞ்சிரம் (Vanjaram)',
        scientificName: 'Scomberomorus commerson',
        abundance: 'Abundant',
        optimalDepthRange: '15m – 35m',
        suggestedGear: 'Drift Gillnet / Trolling Line',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Yellowfin Tuna',
        localName: 'சூரை (Soorai)',
        scientificName: 'Thunnus albacares',
        abundance: 'Moderate',
        optimalDepthRange: '30m – 80m (Thermocline)',
        suggestedGear: 'Longline / Hook & Line',
        waterLayer: 'Mesopelagic (Thermocline)',
      },
      {
        name: 'Tiger Prawns & White Shrimp',
        localName: 'இறால் (Eral)',
        scientificName: 'Penaeus monodon',
        abundance: 'Abundant',
        optimalDepthRange: '10m – 25m',
        suggestedGear: 'Bottom Trawl / Trammel Net',
        waterLayer: 'Demersal (Seabed)',
      },
      {
        name: 'Indian Oil Sardine',
        localName: 'மத்தி (Mathi)',
        scientificName: 'Sardinella longiceps',
        abundance: 'Abundant',
        optimalDepthRange: '5m – 20m',
        suggestedGear: 'Ring Seine / Purse Seine',
        waterLayer: 'Pelagic (Surface)',
      },
    ];
  } else if (state.includes('Karnataka')) {
    primarySpecies = [
      {
        name: 'Seer Fish / King Mackerel',
        localName: 'ಅಂಜಲ್ (Anjal / Kingfish)',
        scientificName: 'Scomberomorus commerson',
        abundance: 'Abundant',
        optimalDepthRange: '12m – 35m',
        suggestedGear: 'Trolling Line & Drift Gillnet',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Indian Mackerel',
        localName: 'ಬಂಗುಡೆ (Bangude)',
        scientificName: 'Rastrelliger kanagurta',
        abundance: 'Abundant',
        optimalDepthRange: '8m – 25m',
        suggestedGear: 'Purse Seine & Gillnet',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Indian Oil Sardine',
        localName: 'ಭೂತಾಯಿ (Boothai)',
        scientificName: 'Sardinella longiceps',
        abundance: 'Abundant',
        optimalDepthRange: '5m – 20m',
        suggestedGear: 'Ring Seine / Encircling Net',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'White Pomfret & Silver Pomfret',
        localName: 'ಮಾಂಜಿ (Maanji / Pomfret)',
        scientificName: 'Pampus argenteus',
        abundance: 'Moderate',
        optimalDepthRange: '15m – 40m',
        suggestedGear: 'Bottom Drift Net',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Prawns / Tiger Shrimp',
        localName: 'ಸಿಗಡಿ (Sigadi / Prawns)',
        scientificName: 'Penaeus monodon',
        abundance: 'Abundant',
        optimalDepthRange: '10m – 30m',
        suggestedGear: 'Bottom Trawl',
        waterLayer: 'Demersal (Seabed)',
      },
    ];
  } else if (state.includes('Kerala') || basin === 'Arabian Sea') {
    primarySpecies = [
      {
        name: 'Indian Oil Sardine',
        localName: 'മത്തി (Mathi)',
        scientificName: 'Sardinella longiceps',
        abundance: 'Abundant',
        optimalDepthRange: '5m – 25m',
        suggestedGear: 'Ring Seine / Encircling Net',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Indian Mackerel',
        localName: 'അയല (Ayala)',
        scientificName: 'Rastrelliger kanagurta',
        abundance: 'Abundant',
        optimalDepthRange: '10m – 30m',
        suggestedGear: 'Gillnet / Hook Line',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Karimeen (Pearl Spot)',
        localName: 'കരിമീൻ (Karimeen)',
        scientificName: 'Etroplus suratensis',
        abundance: 'Moderate',
        optimalDepthRange: '2m – 12m',
        suggestedGear: 'Cast Net / Gillnet',
        waterLayer: 'Demersal (Seabed)',
      },
      {
        name: 'Skipjack Tuna',
        localName: 'ചൂര (Choora)',
        scientificName: 'Katsuwonus pelamis',
        abundance: 'Abundant',
        optimalDepthRange: '25m – 60m',
        suggestedGear: 'Pole & Line / Longline',
        waterLayer: 'Mesopelagic (Thermocline)',
      },
    ];
  } else if (state.includes('Gujarat') || state.includes('Maharashtra')) {
    primarySpecies = [
      {
        name: 'Silver / White Pomfret',
        localName: 'પાપલેટ / पापलेट (Paplet)',
        scientificName: 'Pampus argenteus',
        abundance: 'Abundant',
        optimalDepthRange: '15m – 40m',
        suggestedGear: 'Bottom Drift Net',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Bombay Duck',
        localName: 'બુમલા / बोंबील (Bombil)',
        scientificName: 'Harpadon nehereus',
        abundance: 'Abundant',
        optimalDepthRange: '8m – 30m',
        suggestedGear: 'Dol Net (Stake Net)',
        waterLayer: 'Demersal (Seabed)',
      },
      {
        name: 'Ribbonfish',
        localName: 'વાળા / रिबन फिश (Vala)',
        scientificName: 'Trichiurus lepturus',
        abundance: 'Moderate',
        optimalDepthRange: '20m – 50m',
        suggestedGear: 'Trawl Net',
        waterLayer: 'Demersal (Seabed)',
      },
      {
        name: 'Ghol Fish (Blackspotted Croaker)',
        localName: 'ઘોલ / घोल मासा (Ghol)',
        scientificName: 'Protonibea diacanthus',
        abundance: 'Seasonal',
        optimalDepthRange: '30m – 70m',
        suggestedGear: 'Bottom Longline',
        waterLayer: 'Demersal (Seabed)',
      },
    ];
  } else if (state.includes('Bengal') || state.includes('Odisha')) {
    primarySpecies = [
      {
        name: 'Hilsa / Ilish',
        localName: 'ইলিশ / ଇଲିଶି (Ilish)',
        scientificName: 'Tenualosa ilisha',
        abundance: 'Abundant',
        optimalDepthRange: '5m – 20m',
        suggestedGear: 'Drift Gillnet',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Bhetki (Asian Seabass)',
        localName: 'ভেটকি / ଭେଟକି (Bhetki)',
        scientificName: 'Lates calcarifer',
        abundance: 'Moderate',
        optimalDepthRange: '5m – 15m',
        suggestedGear: 'Hook & Line / Gillnet',
        waterLayer: 'Demersal (Seabed)',
      },
      {
        name: 'Prawns & Mud Crabs',
        localName: 'চিংড়ি ও কাঁকড়া / ଚିଙ୍ଗୁଡ଼ି',
        scientificName: 'Penaeus indicus',
        abundance: 'Abundant',
        optimalDepthRange: '3m – 18m',
        suggestedGear: 'Bag Net / Crab Pot',
        waterLayer: 'Demersal (Seabed)',
      },
    ];
  } else {
    primarySpecies = [
      {
        name: 'Yellowfin & Skipjack Tuna',
        localName: 'Tuna Fish',
        scientificName: 'Thunnus albacares',
        abundance: 'Abundant',
        optimalDepthRange: '20m – 60m',
        suggestedGear: 'Surface Trolling & Longline',
        waterLayer: 'Pelagic (Surface)',
      },
      {
        name: 'Mackerel & Sardines',
        localName: 'Coastal Pelagics',
        scientificName: 'Rastrelliger kanagurta',
        abundance: 'Abundant',
        optimalDepthRange: '10m – 30m',
        suggestedGear: 'Gillnet',
        waterLayer: 'Pelagic (Surface)',
      },
    ];
  }

  return {
    pfzStatus,
    pfzReason,
    chlorophyllMgM3,
    phytoplanktonIndex,
    dissolvedOxygenMlPerL,
    thermoclineDepthMeters,
    optimumCatchDepth,
    seabedStructure,
    salinityHaloclinePsu: float.surfaceSalinity,
    upwellingStrength,
    primarySpecies,
  };
}


/**
 * Calculates D26 (Depth of 26°C Isotherm) from vertical profile
 */
export function calculateD26(profile: DepthProfilePoint[]): number {
  if (!profile || profile.length < 2) return 0;
  if (profile[0].temp < 26.0) return 0; // Surface is colder than 26°C

  for (let i = 0; i < profile.length - 1; i++) {
    const p1 = profile[i];
    const p2 = profile[i + 1];

    if (p1.temp >= 26.0 && p2.temp <= 26.0) {
      if (Math.abs(p1.temp - p2.temp) < 0.001) return p1.depth;
      const fraction = (p1.temp - 26.0) / (p1.temp - p2.temp);
      return Math.round((p1.depth + fraction * (p2.depth - p1.depth)) * 10) / 10;
    }
  }

  // If entire profile remains above 26C
  const lastPoint = profile[profile.length - 1];
  return lastPoint.temp >= 26.0 ? lastPoint.depth : 0;
}

/**
 * Calculates Tropical Cyclone Heat Potential (TCHP) in kJ/cm²
 * TCHP = rho * Cp * integral_0^D26 (T(z) - 26) dz
 * Constant factor: ~ 0.4097 kJ / (cm² * m * °C)
 */
export function calculateTCHP(profile: DepthProfilePoint[], d26: number): number {
  if (d26 <= 0 || !profile || profile.length < 2) return 0;

  const RHO_CP = 0.4097; // kJ / (cm² * m * °C)
  let totalEnergy = 0;

  for (let i = 0; i < profile.length - 1; i++) {
    const p1 = profile[i];
    const p2 = profile[i + 1];

    if (p1.depth >= d26) break;

    const zTop = p1.depth;
    const zBottom = Math.min(p2.depth, d26);
    const dz = zBottom - zTop;

    if (dz <= 0) continue;

    // Interpolate temp at bottom if bounded by D26
    let tBottom = p2.temp;
    if (p2.depth > d26 && p2.temp < 26.0) {
      tBottom = 26.0;
    }

    const tAvg = (p1.temp + tBottom) / 2;
    const deltaT = Math.max(0, tAvg - 26.0);

    totalEnergy += RHO_CP * deltaT * dz;
  }

  return Math.round(totalEnergy * 10) / 10;
}

/**
 * Calculates Mixed Layer Depth (MLD)
 * Depth where temp drops > 0.2°C from reference depth (10m)
 */
export function calculateMLD(profile: DepthProfilePoint[]): number {
  if (!profile || profile.length < 3) return 20;
  const refTemp = profile.find(p => p.depth >= 10)?.temp || profile[0].temp;

  for (let i = 0; i < profile.length; i++) {
    if (profile[i].depth >= 10 && (refTemp - profile[i].temp) >= 0.2) {
      return profile[i].depth;
    }
  }
  return 35;
}

/**
 * Haversine formula for distance between 2 coordinates in km
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Evaluates holistic ocean risk score for fishermen
 */
export function evaluateOceanRisk(float: ArgoFloat): {
  riskLevel: OceanRiskLevel;
  cycloneScore: number;
  waveScore: number;
  heatwaveScore: number;
  summary: string;
} {
  // Cyclone heat potential score: 0 to 100
  // TCHP > 50 is warning, > 80 is extreme danger
  const tchpScore = Math.min(100, Math.round((float.tchp / 90) * 100));
  const sstScore = Math.min(100, Math.max(0, Math.round(((float.surfaceTemp - 26) / 5) * 100)));
  const cycloneScore = Math.round(tchpScore * 0.65 + sstScore * 0.35);

  // Wave danger score
  const waveScore = Math.min(100, Math.round((float.waveHeight / 4.5) * 100));

  // Marine Heatwave score (SST anomaly)
  const heatwaveScore = Math.min(100, Math.max(0, Math.round((float.sstAnomaly / 2.5) * 100)));

  let riskLevel: OceanRiskLevel = 'LOW_RISK';
  let summary = 'Normal ocean conditions. Safe for deep-sea & artisanal fishing.';

  if (cycloneScore >= 70 || waveScore >= 75 || float.tchp >= 65 || float.waveHeight >= 3.2) {
    riskLevel = 'HIGH_RISK';
    if (cycloneScore >= 70) {
      summary = `CRITICAL CYCLONE HEAT POOL: TCHP ${float.tchp} kJ/cm² and SST ${float.surfaceTemp}°C detected. Deep warm water layer (D26: ${float.d26Depth}m) is rapidly fueling storm intensification. Sea conditions will deteriorate swiftly.`;
    } else {
      summary = `SEVERE SWELL ALERT: Wave height estimated at ${float.waveHeight}m with wind gusts reaching ${float.windSpeedKnots} kts. High risk of vessel capsizing.`;
    }
  } else if (cycloneScore >= 45 || waveScore >= 45 || float.tchp >= 35 || float.waveHeight >= 2.0) {
    riskLevel = 'MODERATE_RISK';
    summary = `MODERATE RISK: Developing rough seas (Waves ~${float.waveHeight}m, TCHP ${float.tchp} kJ/cm²). Small craft and country boats should remain within 10-15 nautical miles of coastline.`;
  }

  return {
    riskLevel,
    cycloneScore,
    waveScore,
    heatwaveScore,
    summary,
  };
}

/**
 * Multilingual advisory translations
 */
export const MULTILINGUAL_ADVISORIES: Record<string, {
  highRisk: string;
  moderateRisk: string;
  lowRisk: string;
  name: string;
}> = {
  en: {
    name: 'English',
    highRisk: 'DANGER: Do NOT venture into deep sea. High cyclone energy and turbulent swells detected. Return to harbor immediately.',
    moderateRisk: 'CAUTION: Moderate sea roughness. Small wooden boats remain near shore. Monitor VHF channel 16.',
    lowRisk: 'SAFE: Ocean conditions are calm and favorable for fishing activities.',
  },
  ta: {
    name: 'தமிழ் (Tamil)',
    highRisk: 'எச்சரிக்கை: ஆழ்கடலுக்கு மீன்பிடிக்க செல்ல வேண்டாம்! சூறாவளி வெப்ப ஆற்றல் மற்றும் கொந்தளிப்பான அலைகள் உள்ளன. உடனடியாக கரைக்கு திரும்பவும்.',
    moderateRisk: 'கவனம்: கடல் சற்று கொந்தளிப்பாக உள்ளது. நாட்டுப் படகுகள் கரைக்கு அருகிலேயே இருக்கவும்.',
    lowRisk: 'பாதுகாப்பானது: கடல் அமைதியாக உள்ளது. மீன்பிடிக்க சாதகமான சூழல்.',
  },
  ml: {
    name: 'മലയാളം (Malayalam)',
    highRisk: 'അപകട മുന്നറിയിപ്പ്: ആഴക്കടലിൽ മീൻപിടുത്തത്തിന് പോകരുത്! ചുഴലിക്കാറ്റ് രൂപപ്പെടാൻ സാധ്യതയുള്ള ശക്തമായ ചൂടും ഉയരമുള്ള തിരമാലകളും. ഉടൻ തീരത്തേക്ക് മടങ്ങുക.',
    moderateRisk: 'ശ്രദ്ധിക്കുക: കടൽ പ്രക്ഷുബ്ധമാകാൻ സാധ്യതയുണ്ട്. ചെറിയ വള്ളങ്ങൾ തീരത്തിനടുത്ത് തുടരുക.',
    lowRisk: 'സുരക്ഷിതം: കടൽ ശാന്തമാണ്. മീൻപിടുത്തത്തിന് അനുകൂല കാലാവസ്ഥ.',
  },
  hi: {
    name: 'हिन्दी (Hindi)',
    highRisk: 'खतरा: गहरे समुद्र में मछली पकड़ने न जाएं! चक्रवात बनने की अत्यधिक संभावना और ऊंची लहरें हैं। तुरंत बंदरगाह पर लौटें।',
    moderateRisk: 'सावधानी: समुद्र में मध्यम हलचल है। छोटी नावें तट के करीब ही रहें।',
    lowRisk: 'सुरक्षित: समुद्र शांत है और मछली पकड़ने के लिए अनुकूल स्थिति है।',
  },
  te: {
    name: 'తెలుగు (Telugu)',
    highRisk: 'హెచ్చరిక: లోతైన సముద్రంలోకి వేటకు వెళ్లవద్దు! తుఫాను ముప్పు మరియు పెద్ద అలలు ఉన్నాయి. వెంటనే తీరానికి తిరిగి రండి.',
    moderateRisk: 'జాగ్రత్త: సముద్రం అలజడిగా ఉంది. చిన్న పడవలు తీరానికి సమీపంలోనే ఉండాలి.',
    lowRisk: 'సురక్షితం: సముద్రం ప్రశాంతంగా ఉంది. వేటకు అనుకూలమైన వాతావరణం.',
  },
  bn: {
    name: 'বাংলা (Bengali)',
    highRisk: 'বিপদ সতর্কবার্তা: গভীর সমুদ্রে মাছ ধরতে যাবেন না! তীব্র ঘূর্ণিঝড়ের শক্তি ও উত্তাল ঢেউ রয়েছে। অবিলম্বে তীরে ফিরে আসুন।',
    moderateRisk: 'সতর্কতা: সমুদ্র মাঝারি উত্তাল। ছোট নৌকাগুলি উপকূলের কাছেই থাকুন।',
    lowRisk: 'নিরাপদ: সমুদ্র শান্ত রয়েছে। মাছ ধরার জন্য অনুকুল পরিবেশ।',
  },
  gu: {
    name: 'ગુજરાતી (Gujarati)',
    highRisk: 'ચેતવણી: દરિયામાં ઊંડે માછીમારી માટે ન જશો! વાવાઝોડાની ઊંચી શક્યતા અને ભારે મોજાં છે. તાત્કાલિક બંદરે પરત ફરો.',
    moderateRisk: 'સાવધાની: દરિયો મધ્યમ તોફાની છે. નાની બોટોએ કાંઠા નજીક રહેવું.',
    lowRisk: 'સલામત: દરિયો શાંત છે અને માછીમારી માટે યોગ્ય વાતાવરણ છે.',
  },
  mr: {
    name: 'मराठी (Marathi)',
    highRisk: 'धोका: खोल समुद्रात मासेमारीसाठी जाऊ नका! चक्रीवादळाची ऊर्जा आणि प्रचंड लाटा आहेत. ताबडतोब बंदरावर परत या.',
    moderateRisk: 'काळजी घ्या: समुद्र काहीसा खवळलेला आहे. लहान बोटींनी किनार्याजवळच राहावे.',
    lowRisk: 'सुरक्षित: समुद्र शांत असून मासेमारीसाठी अनुकूल स्थिती आहे.',
  },
  es: {
    name: 'Español (Spanish)',
    highRisk: 'PELIGRO: NO salir a mar abierto. Alto potencial ciclónico y fuerte oleaje detectado. Regrese a puerto de inmediato.',
    moderateRisk: 'PRECAUCIÓN: Mar moderadamente picado. Embarcaciones menores deben permanecer cerca de la costa.',
    lowRisk: 'SEGURO: Condiciones oceánicas calmas y favorables para la pesca.',
  },
};

/**
 * Formats a ready-to-send 160-char SMS for basic fisherman mobile phones
 */
export function generateEmergencySMS(portName: string, riskLevel: OceanRiskLevel, tchp: number, waveHeight: number): string {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (riskLevel === 'HIGH_RISK') {
    return `[FLOATCHAT ALERT ${timestamp}] ${portName}: CRITICAL DANGER! TCHP ${tchp}kJ/cm2, Wave ${waveHeight}m. Cyclone heat buildup. DO NOT GO TO SEA. Return immediately. VHF:16`;
  }
  if (riskLevel === 'MODERATE_RISK') {
    return `[FLOATCHAT ADVISORY ${timestamp}] ${portName}: MODERATE RISK. Wave ${waveHeight}m. Small boats stay near shore (<10nm). Check updates before sailing. VHF:16`;
  }
  return `[FLOATCHAT NOTICE ${timestamp}] ${portName}: ALL CLEAR. Wave ${waveHeight}m, normal sea temp. Safe window for fishing operations. Safe voyage.`;
}

export interface CoastalRadioStationInfo {
  stationName: string;
  callsign: string;
  primaryVhfChannel: string;
  vhfFrequencyMhz: number;
  hfDistressKhz: number;
  dscMmsi: string;
  coverageSector: string;
  mrccHelpline: string;
  mrccPhoneFormatted: string;
  mrccPhoneRaw: string;
  stationDirectPhone: string;
  stationDirectPhoneFormatted: string;
  districtFisheriesOfficer: string;
  districtFisheriesPhoneRaw: string;
  transmissionRangeNm: number;
  coastalRadarActive: boolean;
}

/**
 * Returns regional coastal radio station details based on state or village
 */
export function getCoastalRadioStation(stateOrPort: string): CoastalRadioStationInfo {
  const str = (stateOrPort || '').toLowerCase();
  
  if (str.includes('tamil') || str.includes('chennai') || str.includes('nagapattinam') || str.includes('rameswaram') || str.includes('tuticorin') || str.includes('kanyakumari') || str.includes('cuddalore') || str.includes('pondicherry') || str.includes('puducherry')) {
    return {
      stationName: 'Chennai Coastal Marine Radio Station',
      callsign: 'VWM (Chennai Radio)',
      primaryVhfChannel: 'VHF Channel 16 (156.800 MHz) & Ch 26',
      vhfFrequencyMhz: 156.8,
      hfDistressKhz: 2182.0,
      dscMmsi: '004190100',
      coverageSector: 'Coromandel Coast & Palk Bay Sector',
      mrccHelpline: '1554',
      mrccPhoneFormatted: '+91-44-23460405',
      mrccPhoneRaw: '+914423460405',
      stationDirectPhone: '+914423460405',
      stationDirectPhoneFormatted: '+91-44-23460405',
      districtFisheriesOfficer: '+91-44-24336311 (Chennai Harbor Master)',
      districtFisheriesPhoneRaw: '+914424336311',
      transmissionRangeNm: 40,
      coastalRadarActive: true,
    };
  }

  if (str.includes('kerala') || str.includes('kochi') || str.includes('cochin') || str.includes('kollam') || str.includes('vizhinjam') || str.includes('kozhikode') || str.includes('alappuzha') || str.includes('munambam') || str.includes('lakshadweep') || str.includes('kavaratti')) {
    return {
      stationName: 'Kochi Maritime Coastal Radio Station',
      callsign: 'VWN (Kochi Radio)',
      primaryVhfChannel: 'VHF Channel 16 (156.800 MHz) & Ch 24',
      vhfFrequencyMhz: 156.8,
      hfDistressKhz: 2182.0,
      dscMmsi: '004190200',
      coverageSector: 'Malabar Coast & Lakshadweep Sea Sector',
      mrccHelpline: '1554',
      mrccPhoneFormatted: '+91-484-2216444',
      mrccPhoneRaw: '+914842216444',
      stationDirectPhone: '+914842216444',
      stationDirectPhoneFormatted: '+91-484-2216444',
      districtFisheriesOfficer: '+91-484-2351234 (Kochi Marine Station)',
      districtFisheriesPhoneRaw: '+914842351234',
      transmissionRangeNm: 45,
      coastalRadarActive: true,
    };
  }

  if (str.includes('karnataka') || str.includes('mangalore') || str.includes('malpe') || str.includes('karwar') || str.includes('tumkur') || str.includes('bangalore') || str.includes('bengaluru') || str.includes('bhatkal') || str.includes('udupi') || str.includes('honnavar')) {
    return {
      stationName: 'Mangalore Coastal Radio & Maritime Control',
      callsign: 'VWO (Mangalore Radio)',
      primaryVhfChannel: 'VHF Channel 16 (156.800 MHz) & Ch 28',
      vhfFrequencyMhz: 156.8,
      hfDistressKhz: 2182.0,
      dscMmsi: '004190300',
      coverageSector: 'Canara Coast & Central Arabian Sea',
      mrccHelpline: '1554',
      mrccPhoneFormatted: '+91-824-2405266',
      mrccPhoneRaw: '+918242405266',
      stationDirectPhone: '+918242405266',
      stationDirectPhoneFormatted: '+91-824-2405266',
      districtFisheriesOfficer: '+91-824-2424108 (Mangalore Fisheries)',
      districtFisheriesPhoneRaw: '+918242424108',
      transmissionRangeNm: 40,
      coastalRadarActive: true,
    };
  }

  if (str.includes('andhra') || str.includes('vizag') || str.includes('visakhapatnam') || str.includes('kakinada') || str.includes('machilipatnam') || str.includes('nizampatnam') || str.includes('krishnapatnam')) {
    return {
      stationName: 'Visakhapatnam Coastal Marine Radio',
      callsign: 'VXV (Vizag Radio)',
      primaryVhfChannel: 'VHF Channel 16 (156.800 MHz) & Ch 27',
      vhfFrequencyMhz: 156.8,
      hfDistressKhz: 2182.0,
      dscMmsi: '004190400',
      coverageSector: 'Northern Bay of Bengal & Andhra Coast',
      mrccHelpline: '1554',
      mrccPhoneFormatted: '+91-891-2565154',
      mrccPhoneRaw: '+918912565154',
      stationDirectPhone: '+918912565154',
      stationDirectPhoneFormatted: '+91-891-2565154',
      districtFisheriesOfficer: '+91-891-2564321 (Vizag Port Control)',
      districtFisheriesPhoneRaw: '+918912564321',
      transmissionRangeNm: 40,
      coastalRadarActive: true,
    };
  }

  if (str.includes('maharashtra') || str.includes('mumbai') || str.includes('bombay') || str.includes('ratnagiri') || str.includes('goa') || str.includes('mormugao') || str.includes('panaji') || str.includes('alibaug') || str.includes('dahanu')) {
    return {
      stationName: 'Mumbai Coast Guard MRCC & Coastal Radio',
      callsign: 'VWE (Mumbai Radio)',
      primaryVhfChannel: 'VHF Channel 16 (156.800 MHz) & Ch 25',
      vhfFrequencyMhz: 156.8,
      hfDistressKhz: 2182.0,
      dscMmsi: '004190500',
      coverageSector: 'Konkan Coast & Northern Arabian Sea',
      mrccHelpline: '1554',
      mrccPhoneFormatted: '+91-22-24388065',
      mrccPhoneRaw: '+912224388065',
      stationDirectPhone: '+912224388065',
      stationDirectPhoneFormatted: '+91-22-24388065',
      districtFisheriesOfficer: '+91-22-22612345 (Mumbai Harbor Master)',
      districtFisheriesPhoneRaw: '+912222612345',
      transmissionRangeNm: 50,
      coastalRadarActive: true,
    };
  }

  if (str.includes('gujarat') || str.includes('veraval') || str.includes('okha') || str.includes('kandla') || str.includes('porbandar') || str.includes('mundra') || str.includes('jafrabad') || str.includes('mangrol')) {
    return {
      stationName: 'Okha / Veraval Maritime Coastal Radio',
      callsign: 'VWP (Gujarat Coast Radio)',
      primaryVhfChannel: 'VHF Channel 16 (156.800 MHz) & Ch 23',
      vhfFrequencyMhz: 156.8,
      hfDistressKhz: 2182.0,
      dscMmsi: '004190600',
      coverageSector: 'Gulf of Kutch & Saurashtra Coast',
      mrccHelpline: '1554',
      mrccPhoneFormatted: '+91-2892-262154',
      mrccPhoneRaw: '+912892262154',
      stationDirectPhone: '+912892262154',
      stationDirectPhoneFormatted: '+91-2892-262154',
      districtFisheriesOfficer: '+91-2876-220100 (Veraval Port Control)',
      districtFisheriesPhoneRaw: '+912876220100',
      transmissionRangeNm: 45,
      coastalRadarActive: true,
    };
  }

  if (str.includes('odisha') || str.includes('orissa') || str.includes('puri') || str.includes('paradip') || str.includes('dhamra') || str.includes('gopalpur') || str.includes('bengal') || str.includes('kolkata') || str.includes('digha') || str.includes('haldia') || str.includes('kakdwip') || str.includes('andaman') || str.includes('port blair')) {
    return {
      stationName: 'Paradip & Kolkata Coastal Radio Station',
      callsign: 'VWP (East Coast Maritime)',
      primaryVhfChannel: 'VHF Channel 16 (156.800 MHz) & Ch 26',
      vhfFrequencyMhz: 156.8,
      hfDistressKhz: 2182.0,
      dscMmsi: '004190700',
      coverageSector: 'Odisha & Bengal Delta Coastal Zone',
      mrccHelpline: '1554',
      mrccPhoneFormatted: '+91-6722-222144',
      mrccPhoneRaw: '+916722222144',
      stationDirectPhone: '+91-6722-222144',
      stationDirectPhoneFormatted: '+91-6722-222144',
      districtFisheriesOfficer: '+91-3220-266100 (Digha Coastal Station)',
      districtFisheriesPhoneRaw: '+913220266100',
      transmissionRangeNm: 45,
      coastalRadarActive: true,
    };
  }

  // Default National Coastal Station
  return {
    stationName: 'National Coastal Maritime Radio Network',
    callsign: 'VWM / IN-MRCC',
    primaryVhfChannel: 'VHF Channel 16 (156.800 MHz)',
    vhfFrequencyMhz: 156.8,
    hfDistressKhz: 2182.0,
    dscMmsi: '004190001',
    coverageSector: 'Indian Ocean Coastal & EEZ Zone',
    mrccHelpline: '1554',
    mrccPhoneFormatted: '1554 (Coast Guard MRCC)',
    mrccPhoneRaw: '1554',
    stationDirectPhone: '+914423460405',
    stationDirectPhoneFormatted: '+91-44-23460405',
    districtFisheriesOfficer: '1800-425-1554 (Fisheries Control)',
    districtFisheriesPhoneRaw: '18004251554',
    transmissionRangeNm: 35,
    coastalRadarActive: true,
  };
}

/**
 * Formats a specialized, high-priority emergency SMS targeting the registered captain's phone number
 */
export function generateRegisteredCaptainSMS(
  user: UserProfile | null,
  float: ArgoFloat,
  currentVillageName: string,
  currentStateName: string,
  riskLevel: OceanRiskLevel,
  pos: { lat: number; lng: number; offshoreNm?: number },
  isJammedOrOffline: boolean = true
): {
  smsText: string;
  targetPhone: string;
  captainName: string;
  boatName: string;
  boatRegNumber: string;
  charCount: number;
} {
  const captain = user?.name || 'Capt. Murugesan';
  const phone = user?.phone || '+91 94440 15540';
  const boat = user?.boatName || 'Meenava Thalaivan';
  const regNumber = user?.boatRegNumber || 'IND-TN-02-MM-1088';
  const village = user?.villageOrPort || currentVillageName || 'Kasimedu';
  const state = user?.state || currentStateName || 'Tamil Nadu';
  const offshore = pos.offshoreNm ? `${pos.offshoreNm}NM` : '15NM';
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const statusTag = isJammedOrOffline ? 'NET-FAILOVER' : 'AUTO-ALERT';
  
  // Compact 160-char GSM compatible text
  const smsText = `[FLOAT-ALERT ${timestamp}] ${captain}|${boat}(${regNumber})|POS:${pos.lat.toFixed(3)}N,${pos.lng.toFixed(3)}E(${offshore} off ${village})|${statusTag}|BUOY #${float.wmoId}:WAVE ${float.waveHeight}m,TCHP ${float.tchp}k|HAZARD:${riskLevel}|VHF:16`;

  return {
    smsText,
    targetPhone: phone,
    captainName: captain,
    boatName: boat,
    boatRegNumber: regNumber,
    charCount: smsText.length,
  };
}

/**
 * Formats a VHF Coastal Marine Distress/Securite Radio script
 */
export function generateVhfRadioScript(portName: string, riskLevel: OceanRiskLevel, floatWmo: string, tchp: number, waveHeight: number): string {
  if (riskLevel === 'HIGH_RISK') {
    return `SECURITE SECURITE SECURITE. ALL SHIPS ALL STATIONS. THIS IS FLOATCHAT COASTAL MARITIME ADVISORY FOR ${portName.toUpperCase()} SECTOR. ARGO BUOY ${floatWmo} REPORTS SEVERE TROPICAL CYCLONE HEAT POTENTIAL ${tchp} KILOJOULES PER SQUARE CENTIMETER. ESTIMATED WAVE SWELL ${waveHeight} METERS. ALL FISHING VESSELS STRONGLY ADVISED TO HALT OPERATIONS AND PROCEED TO SHELTERED HARBOR IMMEDIATELY. MAINTAIN WATCH ON VHF CHANNEL 16. OUT.`;
  }
  if (riskLevel === 'MODERATE_RISK') {
    return `SECURITE SECURITE SECURITE. ALL STATIONS. FLOATCHAT MARINE BULLETIN FOR ${portName.toUpperCase()}. MODERATE SWELL AND THERMAL TURBULENCE REPORTED. WAVE HEIGHT ${waveHeight} METERS. ARTISANAL CRAFTS ADVISE CLOSE INSHORE NAVIGATION ONLY. STANDBY ON CHANNEL 16. OUT.`;
  }
  return `ALL STATIONS. FLOATCHAT ROUTINE BULLETIN FOR ${portName.toUpperCase()}. NORMAL SWELL ${waveHeight} METERS. SST STABLE. SAFE NAVIGATION REPORTED ACROSS ALL INSHORE SECTORS. STANDBY ON CHANNEL 16. OUT.`;
}

/**
 * Assembles a comprehensive, maritime-standard Emergency Radio & DSC Data Packet
 * for a registered captain and vessel in case of signal jamming, deadzone, or extreme ocean risk.
 */
export function generateRegisteredCaptainRadioPacket(
  user: UserProfile | null,
  float: ArgoFloat,
  currentVillageName: string,
  currentStateName: string,
  sensor: MobileSensorReading,
  riskLevel: OceanRiskLevel,
  triggerReason: 'SIGNAL_JAMMED' | 'CAPSIZING_ALERT' | 'HIGH_SWELL' | 'MANUAL_MAYDAY' | 'DEADZONE_AUTO_TRIGGER',
  overridePos?: { lat: number; lng: number; offshoreNm?: number }
): RegisteredRadioPacket {
  const captain = user?.name || 'Authorized Coastal Captain';
  const phone = user?.phone || '+91-94440-15540';
  const boat = user?.boatName || 'Meenava Thalaivan';
  const regNumber = user?.boatRegNumber || 'IND-TN-02-MM-1088';
  const boatType = user?.boatType || 'Motorized Trawler';
  const crewCount = user?.crewMembersCount || 4;
  const village = user?.villageOrPort || currentVillageName || 'Kasimedu Coastal Sector';
  const state = user?.state || currentStateName || 'Tamil Nadu';
  const language = user?.language || 'en';

  const lat = overridePos?.lat ?? sensor.gpsLat ?? float.lat;
  const lng = overridePos?.lng ?? sensor.gpsLng ?? float.lng;
  const offshoreNm = overridePos?.offshoreNm ?? (Math.round(calculateDistanceKm(float.lat, float.lng, lat, lng) * 0.539957) || 18.5);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const utcStr = now.toISOString().replace(/T/, ' ').slice(0, 19) + ' UTC';

  // Determine urgency prefix
  const callPrefix = triggerReason === 'CAPSIZING_ALERT' || triggerReason === 'MANUAL_MAYDAY'
    ? 'MAYDAY MAYDAY MAYDAY'
    : 'PAN-PAN PAN-PAN PAN-PAN';

  const spokenVhfScript = `${callPrefix}. ALL STATIONS, ALL STATIONS, ALL STATIONS. THIS IS REGISTERED VESSEL "${boat.toUpperCase()}", REGISTRATION ${regNumber.toUpperCase()}, CALLING ON VHF CHANNEL 16 AND HF EMERGENCY FREQUENCY 2182 KHZ.

I AM CAPTAIN ${captain.toUpperCase()}, REGISTERED CELL ${phone}, DEPARTED FROM ${village.toUpperCase()}, ${state.toUpperCase()}. WE HAVE ${crewCount} SOULS ON BOARD.

VESSEL TYPE: ${boatType.toUpperCase()}.
LAST KNOWN POSITION: ${lat.toFixed(4)} NORTH, ${lng.toFixed(4)} EAST, APPROXIMATELY ${offshoreNm} NAUTICAL MILES OFFSHORE.
HEADING: ${sensor.compassHeading || 115} DEGREES AT ${sensor.gpsSpeedKnots || 8.5} KNOTS.

AUTOMATIC TRANSMISSION TRIGGER: ${triggerReason.replace(/_/g, ' ')}.
COMMUNICATION LINK: SATELLITE & 4G/5G CARRIER DEADZONE / JAMMED. AUTOMATIC RADIO BEACON ACTIVATED.

LOCAL OCEAN TELEMETRY VIA NEAREST ARGO BUOY #${float.wmoId}:
WAVE SWELL ESTIMATED AT ${float.waveHeight} METERS.
TROPICAL CYCLONE HEAT POTENTIAL: ${float.tchp} KILOJOULES PER SQUARE CENTIMETER.
SEA SURFACE TEMPERATURE: ${float.surfaceTemp} DEGREES CELSIUS.
OVERALL MARITIME HAZARD LEVEL: ${riskLevel.replace(/_/g, ' ')}.

REQUEST ALL VESSELS IN VICINITY AND INDIAN COAST GUARD MRCC AT HELPLINE 1554 TO LOG OUR POSITION, MAINTAIN RADAR VIGILANCE, AND RELAY ACKNOWLEDGEMENT ON VHF CHANNEL 16.

VESSEL "${boat.toUpperCase()}" REGISTRATION ${regNumber.toUpperCase()} OVER AND STANDING BY ON CHANNEL 16.`;

  const dscAlertFormat = `DSC-DISTRESS: MMSI-419001088 // CALLSIGN: ${regNumber} // VESSEL: ${boat} // MASTER: ${captain} // NATURE: ${triggerReason} // POS: ${lat.toFixed(4)}N ${lng.toFixed(4)}E // OFFSHORE: ${offshoreNm}NM // POB: ${crewCount} // ARGO-LINK: #${float.wmoId} // TCHP: ${float.tchp} // WAVE: ${float.waveHeight}M // TIME: ${utcStr}`;

  const hexBytes = `0xAA55F0${regNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 8)}E944${Math.round(lat * 1000).toString(16)}${Math.round(lng * 1000).toString(16)}FF`;

  return {
    id: `RADIO-PKT-${Date.now()}`,
    captainName: captain,
    phone,
    boatName: boat,
    boatRegNumber: regNumber,
    boatType,
    crewMembersCount: crewCount,
    homeVillageOrPort: village,
    state,
    language,
    lat,
    lng,
    distanceOffshoreNm: offshoreNm,
    headingDegrees: sensor.compassHeading || 115,
    speedKnots: sensor.gpsSpeedKnots || 8.5,
    waveHeightM: float.waveHeight,
    tchpKjCm2: float.tchp,
    surfaceTempC: float.surfaceTemp,
    nearestFloatWmo: float.wmoId,
    riskLevel,
    triggerReason,
    signalStatus: 'RADIO BEACON ACTIVE',
    vhfChannel: 'VHF Ch 16 (156.800 MHz) Distress & Calling',
    hfFrequency: 'HF 2182.0 kHz / DSC 2187.5 kHz',
    dscAlertFormat,
    spokenVhfScript,
    rawTelegramHex: hexBytes.toUpperCase(),
    timestamp: timeStr,
    transmissionLog: [
      {
        time: timeStr,
        protocol: 'VHF Ch 16 (156.8 MHz FM)',
        status: 'TRANSMITTED',
        details: `Spoken Radio Distress broadcast for Captain ${captain} (${boat}) with GPS Fix & Ocean Wave Data`,
      },
      {
        time: timeStr,
        protocol: 'Marine DSC Alert (Ch 70 / 2187.5 kHz)',
        status: 'TRANSMITTED',
        details: `Digital Selective Calling Distress Telegram dispatched to Coast Guard MRCC`,
      },
      {
        time: timeStr,
        protocol: 'Cospas-Sarsat EPIRB Beacon (406.025 MHz)',
        status: 'TRANSMITTED',
        details: `Encrypted Satellite Emergency Position Indicating Radio Beacon hex ${hexBytes.slice(0, 10)}`,
      },
      {
        time: timeStr,
        protocol: 'Indian Coast Guard SAR Relay (Helpline 1554)',
        status: 'ACKNOWLEDGED',
        details: `Automated station registry log confirmed for ${regNumber} (${village}, ${state})`,
      },
    ],
  };
}

/**
 * Plays an authentic VHF marine radio tone, squelch chirp, and speaks the registered distress script
 */
export function playMarineRadioDistressAudio(
  scriptText: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return () => {};
  }

  let isCancelled = false;
  window.speechSynthesis.cancel();

  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play Maritime Two-Tone Alarm (2200Hz and 1300Hz alternation)
    const t0 = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(2200, t0);
    osc1.frequency.setValueAtTime(1300, t0 + 0.15);
    osc1.frequency.setValueAtTime(2200, t0 + 0.30);
    osc1.frequency.setValueAtTime(1300, t0 + 0.45);
    
    gain1.gain.setValueAtTime(0.25, t0);
    gain1.gain.exponentialRampToValueAtTime(0.01, t0 + 0.6);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(t0);
    osc1.stop(t0 + 0.6);

    // Initial VHF Radio squelch burst (white noise burst)
    const bufferSize = audioCtx.sampleRate * 0.12;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.18, t0 + 0.65);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.77);
    whiteNoise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    whiteNoise.start(t0 + 0.65);

    // Speak radio distress with maritime cadence after tones
    setTimeout(() => {
      if (isCancelled) return;
      if (onStart) onStart();

      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.rate = 0.94;
      utterance.pitch = 0.98;

      utterance.onend = () => {
        // End Roger Beep
        try {
          const endOsc = audioCtx.createOscillator();
          const endGain = audioCtx.createGain();
          endOsc.type = 'sine';
          endOsc.frequency.setValueAtTime(1400, audioCtx.currentTime);
          endGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          endGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
          endOsc.connect(endGain);
          endGain.connect(audioCtx.destination);
          endOsc.start();
          endOsc.stop(audioCtx.currentTime + 0.15);
        } catch (e) {}
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    }, 800);

  } catch (e) {
    if (onStart) onStart();
    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = () => { if (onEnd) onEnd(); };
    window.speechSynthesis.speak(utterance);
  }

  return () => {
    isCancelled = true;
    window.speechSynthesis.cancel();
  };
}

/**
 * Plays a distinct two-tone radio frequency handshake synthesizer chime (VHF Carrier Lock)
 */
export function playRadioHandshakeSound(): void {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;
    const audioCtx = new AudioCtxClass();
    const t0 = audioCtx.currentTime;

    // Dual Frequency Subcarrier Tuning beep (800Hz -> 1750Hz lock)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t0);
    osc.frequency.exponentialRampToValueAtTime(1750, t0 + 0.12);
    osc.frequency.setValueAtTime(1750, t0 + 0.12);
    osc.frequency.setValueAtTime(2182, t0 + 0.22);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
    gain.gain.setValueAtTime(0.18, t0 + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.38);
  } catch (e) {
    // Graceful fallback
  }
}

