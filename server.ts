import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { BASE_ARGO_FLOATS, COASTAL_PORTS, getEnrichedFloats } from './src/data/argoDataset.ts';
import { evaluateOceanRisk, generateEmergencySMS, generateVhfRadioScript, MULTILINGUAL_ADVISORIES } from './src/utils/oceanPhysics.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory active ARGO dataset with real-time simulated telemetry
let currentFloats = getEnrichedFloats(BASE_ARGO_FLOATS);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FloatChat AI Ocean Intelligence Engine',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    floatsCount: currentFloats.length,
    timestamp: new Date().toISOString(),
  });
});

// Get ARGO floats data
app.get('/api/argo/floats', (req, res) => {
  const { basin, minRisk } = req.query;
  let result = currentFloats;

  if (basin && typeof basin === 'string' && basin !== 'ALL') {
    result = result.filter(f => f.basin.toLowerCase().includes(basin.toLowerCase()));
  }

  if (minRisk && typeof minRisk === 'string') {
    result = result.filter(f => f.riskLevel === minRisk);
  }

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
    totalCount: result.length,
  });
});

// Get Coastal Ports
app.get('/api/argo/ports', (req, res) => {
  res.json({
    success: true,
    data: COASTAL_PORTS,
  });
});

// AI Conversational Chat Endpoint for Fishermen
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();
    const portName = context?.villageName || context?.selectedPort?.name || 'Local Coastal Waters';
    const stateName = context?.state || '';
    const captainName = context?.captainName || '';
    const boatName = context?.boatName || '';
    const boatType = context?.boatType || '';
    const nearestFloat = context?.selectedFloat || currentFloats[0];
    const language = context?.language || 'en';
    const isOfflineMode = Boolean(context?.offlineMode);

    // Fallback if no API key or offline simulation
    if (!ai || isOfflineMode) {
      const risk = evaluateOceanRisk(nearestFloat);
      const localized = MULTILINGUAL_ADVISORIES[language] || MULTILINGUAL_ADVISORIES.en;
      let offlineText = '';

      const captainPrefix = captainName ? `Captain ${captainName} (${boatName || 'Vessel'} - ${boatType || 'Fishing Craft'}), ` : '';

      if (risk.riskLevel === 'HIGH_RISK') {
        offlineText = `🚨 [FloatChat Offline Engine - High Danger Warning]\n\n` +
          `${captainPrefix}${localized.highRisk}\n\n` +
          `• Sector: ${portName} ${stateName ? `(${stateName})` : ''} | Linked ARGO Buoy #${nearestFloat.wmoId}\n` +
          `• Ocean Energy: High Cyclone Heat Potential (${nearestFloat.tchp} kJ/cm²) with Sea Surface Temp ${nearestFloat.surfaceTemp}°C.\n` +
          `• Wave Swell: ~${nearestFloat.waveHeight}m, Surface Winds: ${nearestFloat.windSpeedKnots} knots.\n` +
          `• Action Directive: STRICT RED ALERT — DO NOT venture to sea. If sailing, return immediately to ${portName}.\n` +
          `• Emergency VHF: Channel 16 | Coast Guard Helpline: 1554`;
      } else if (risk.riskLevel === 'MODERATE_RISK') {
        offlineText = `⚠️ [FloatChat Offline Engine - Moderate Risk Notice]\n\n` +
          `${captainPrefix}${localized.moderateRisk}\n\n` +
          `• Sector: ${portName} ${stateName ? `(${stateName})` : ''} | Linked ARGO Buoy #${nearestFloat.wmoId}\n` +
          `• Ocean Conditions: Wave swells ~${nearestFloat.waveHeight}m, Wind gusts up to ${nearestFloat.windSpeedKnots} kts. TCHP is ${nearestFloat.tchp} kJ/cm².\n` +
          `• Operational Advisory: Country crafts & small catamarans stay strictly within 8-10 nautical miles. Keep lifejackets equipped.`;
      } else {
        offlineText = `✅ [FloatChat Offline Engine - Safe Fishing Window]\n\n` +
          `${captainPrefix}${localized.lowRisk}\n\n` +
          `• Sector: ${portName} ${stateName ? `(${stateName})` : ''} | Linked ARGO Buoy #${nearestFloat.wmoId}\n` +
          `• Ocean State: Calm sea conditions (Waves ~${nearestFloat.waveHeight}m, Temp ${nearestFloat.surfaceTemp}°C, Wind ${nearestFloat.windSpeedKnots} kts).\n` +
          `• Operational Advisory: Safe sailing window open for deep sea and coastal fishing up to standard zones.`;
      }

      return res.json({
        reply: offlineText,
        source: 'local-offline-rules-engine',
        riskLevel: risk.riskLevel,
        isFallback: true,
      });
    }

    // Prepare system instruction for Gemini
    const systemPrompt = `You are FloatChat, an AI Ocean Risk & Safety Assistant designed specifically for fishermen, coastal boat masters, harbor authorities, and non-experts.
Your primary mission is to save lives at sea by translating complex oceanographic ARGO float data (Depth of 26°C isotherm / D26, Tropical Cyclone Heat Potential / TCHP, Salinity haloclines, Sea Surface Temperature anomalies, Swells) into extremely clear, direct, and actionable marine safety guidance.

CURRENT USER & VESSEL PROFILE:
- Captain Name: ${captainName || 'Coastal Captain'}
- Boat/Vessel: ${boatName || 'Fishing Craft'} (${boatType || 'Motorized Vessel'})
- Coastal Sector / Village / State: ${portName} ${stateName ? `, ${stateName}` : ''}

CURRENT SITUATION DATA:
- Nearest ARGO Float Buoy: #${nearestFloat.wmoId} (${nearestFloat.name})
- Sea Surface Temperature (SST): ${nearestFloat.surfaceTemp}°C (Anomaly: ${nearestFloat.sstAnomaly > 0 ? '+' : ''}${nearestFloat.sstAnomaly}°C)
- Depth of 26°C Isotherm (D26): ${nearestFloat.d26Depth} meters
- Tropical Cyclone Heat Potential (TCHP): ${nearestFloat.tchp} kJ/cm² (Scientific Note: TCHP > 50 kJ/cm² represents a high energy reservoir capable of fueling rapid cyclone intensification)
- Estimated Wave Height: ${nearestFloat.waveHeight} meters
- Wind Speed: ${nearestFloat.windSpeedKnots} knots
- Evaluated Risk Status: ${nearestFloat.riskLevel} (${nearestFloat.riskCategory})
- Target Language: ${language} (If requested language is Tamil, Malayalam, Hindi, Telugu, Bengali, Gujarati, Marathi, Odia, or Spanish, respond in that language with clear script, plus brief English summary if helpful).

TONE & GUIDELINES:
1. Speak with clarity, respect, urgency when needed, and seafaring practicality. Address the captain directly.
2. Avoid dense academic jargon without an intuitive explanation (e.g. explain TCHP as "hidden ocean heat fuel that can turn an ordinary wind into a violent cyclone overnight").
3. Give an unmistakable, decisive bottom-line answer first: "GO", "STAY NEAR SHORE (WITHIN X NM)", or "STAY ON LAND / RETURN IMMEDIATELY".
4. Take into account their vessel type (${boatType || 'standard boat'}) when giving safe sea distances.
5. If the fisherman asks in a native language or asks for local dialect terms, gladly provide it.`;

    const userPrompt = `User question / situation: "${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'Unable to generate ocean safety advisory at this moment.';

    res.json({
      reply: replyText,
      source: 'gemini-3.7-flash',
      riskLevel: nearestFloat.riskLevel,
      nearestFloat: {
        wmoId: nearestFloat.wmoId,
        surfaceTemp: nearestFloat.surfaceTemp,
        tchp: nearestFloat.tchp,
        waveHeight: nearestFloat.waveHeight,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({
      error: 'Failed to process AI safety chat',
      details: error?.message || String(error),
    });
  }
});

// Deep AI Ocean Risk Analysis Endpoint
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { floatData, portData, language = 'en' } = req.body;
    const float = floatData || currentFloats[0];
    const port = portData || COASTAL_PORTS[0];
    const ai = getGeminiClient();

    const risk = evaluateOceanRisk(float);
    const sms = generateEmergencySMS(port.name, risk.riskLevel, float.tchp, float.waveHeight);
    const vhf = generateVhfRadioScript(port.name, risk.riskLevel, float.wmoId, float.tchp, float.waveHeight);

    let aiDetailedAnalysis = '';

    if (ai) {
      const prompt = `Analyze this specific ocean profile for fishermen safety:
- Port: ${port.name} (${port.country})
- ARGO Float #${float.wmoId} (${float.basin})
- Surface Temp: ${float.surfaceTemp}°C
- D26 Thermocline Depth: ${float.d26Depth}m
- TCHP (Cyclone Heat Potential): ${float.tchp} kJ/cm²
- Wave Swell: ${float.waveHeight}m, Wind: ${float.windSpeedKnots} kts
- Target Language: ${language}

Provide a concise 3-part brief:
1. Threat Level & Safety Decision (Safe to fish, Caution, or Total Sea Ban)
2. Oceanographic Cause in Plain Words (Why the sea is behaving this way based on ARGO thermal depth)
3. 24-Hour Sea Forecast for Coastal Craft`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.5,
        },
      });
      aiDetailedAnalysis = response.text || '';
    } else {
      aiDetailedAnalysis = risk.summary;
    }

    res.json({
      success: true,
      assessment: {
        portId: port.id,
        portName: port.name,
        timestamp: new Date().toISOString(),
        overallStatus: risk.riskLevel,
        threatTitle: risk.riskLevel === 'HIGH_RISK' ? 'Severe Cyclone Heat Energy Alert' : risk.riskLevel === 'MODERATE_RISK' ? 'Moderate Sea Swell Advisory' : 'Safe Fishing Conditions',
        simpleAdvice: risk.summary,
        aiDetailedAnalysis,
        cycloneHeatScore: risk.cycloneScore,
        waveSurgeScore: risk.waveScore,
        marineHeatwaveScore: risk.heatwaveScore,
        tchpValue: float.tchp,
        d26Value: float.d26Depth,
        emergencySms: sms,
        vhfBroadcastScript: vhf,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze:', error);
    res.status(500).json({ error: 'Failed to generate deep ocean analysis' });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FloatChat AI Ocean Intelligence server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
