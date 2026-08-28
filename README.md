# 🌊 FLOATCHAT — Coastal & Deep-Sea Ocean Intelligence System

**FLOATCHAT** is a full-stack maritime safety, ARGO oceanographic profiler intelligence, 3D tactical command interface, and automated emergency failover system designed for seafarers, fishermen, coastal communities, and maritime authorities across the Indian Ocean and global marine zones.

---

## 🌟 3D User Interface & Tactile Visual Design

- **Holographic 3D Glassmorphism**: High-performance multi-layered glass cards with depth elevations, dynamic specular light highlights, and blur overlays.
- **3D Ocean Perspective & Depth Grids**: Dynamic 3D isometric perspective grids, depth radar sweeps, and live satellite wave telemetry.
- **Tactile 3D Action Controls**: Responsive 3D physical push-state buttons (`active:translate-y-0.5`, tactile inset borders) for instant feedback even with wet fingertips or gloves at sea.
- **Floating 3D ARGO Buoy Indicators**: Interactive, floating 3D bobbing ocean profiler nodes showing live wave height, temperature, and heat flux gradients.

---

## 🌟 Core System Features

### 1. 📡 Automatic GPS Tracking & Geolocation Resolver
- **Real-Time GPS Acquisition**: Instantly tracks vessel and device coordinates (`Latitude` & `Longitude`) with high-accuracy GPS fixes.
- **Coastal Village & State Search Directory**: Resolves and maps any coastal village, district, or harbor (e.g., *Kasimedu, Dhanushkodi, Vizhinjam, Malpe, Veraval, Puri, Digha, Kavaratti*) to the closest ocean sector.
- **Geodesic Nautical Navigation**: Automatically computes bearing, nautical distance (NM), and safe navigation corridors toward live ARGO oceanographic floats.

### 2. 📴 Ocean Voyage Simulation & Anti-Jamming Failover
- **Voyage Departure Engine**: Simulates and tracks craft movement from harbor basin ($0\text{ NM}$) through cellular coverage ($0\text{--}12\text{ NM}$) into deep-sea satellite zones ($15\text{--}45+\text{ NM}$).
- **Signal Jamming / Deadzone Detection**: Detects complete internet breakdown, network failure, or signal jamming at sea.
- **Instant Transponder Engagement**: Automatically routes emergency communications through autonomous offline channels when regular data fails.

### 3. 📻 Automated Coastal Marine Radio Station Connection
- **Dynamic Regional Station Linking**: Auto-connects to the nearest regional Indian Coastal Radio Station based on coordinates and state:
  - *Chennai Coastal Radio (`VWM`)* — Coromandel Coast & Palk Bay
  - *Kochi Coastal Radio (`VWN`)* — Malabar Coast & Lakshadweep Sea
  - *Mangalore Coastal Radio (`VWO`)* — Canara Coast & Central Arabian Sea
  - *Visakhapatnam Coastal Radio (`VXV`)* — Northern Bay of Bengal
  - *Mumbai Coastal Radio (`VWE`)* — Konkan Coast & North Arabian Sea
  - *Okha / Veraval Coastal Radio (`VWP`)* — Gulf of Kutch & Saurashtra
  - *Paradip & Kolkata Coastal Radio (`VWP`)* — Odisha & Bengal Delta
- **Radio Frequencies & Helplines**:
  - Primary VHF Marine Channel 16 (156.800 MHz) & Working Channels (23–28)
  - MF/HF Distress Frequency (2182.0 kHz)
  - Maritime DSC MMSI Routing (e.g., `004190100`)
  - Direct 24x7 Coast Guard MRCC Helpline (`1554`) and Direct Landlines
  - District Fisheries Control Room Numbers

### 4. 📲 Automated Emergency SMS to Registered Phone Numbers
- **Instant GSM 2G Failover**: Generates verified 160-character compact SMS payloads compatible with basic fisherman feature phones and mobile networks.
- **Automatic Metadata Inclusion**:
  - Registered Captain Name (e.g., *Capt. Murugesan*)
  - Registered Mobile Number (e.g., `+91 94440 15540`)
  - Official Vessel Registration Code (e.g., `IND-TN-02-MM-1088`)
  - Live GPS Coordinates & Distance Offshore
  - ARGO Buoy Wave Swell & Tropical Cyclone Heat Potential (TCHP)
  - Hazard Level & Emergency Transmit Timestamp
- **Native Direct Action**: Interactive button to launch device SMS directly (`sms:+919444015540?body=...`) or share with emergency dispatchers.

### 5. 🔊 Voice Synthesizer & Dual-Tone Radio Siren
- **Marine VHF Voice Broadcast**: Synthesizes spoken radio Mayday / Securité calls with maritime acoustic bandpass filtering and squelch noise.
- **Two-Tone Distress Siren**: Realistic 2200 Hz & 1300 Hz international maritime distress alarm tones.

---

## ⚡ Backend Architecture & API Specifications

The server backend is powered by **Express.js** running with **TypeScript (`tsx`)** and compiles to a production CommonJS bundle via `esbuild`.

### Backend API Endpoints:

| Method | Endpoint | Description | Payload / Query Params |
|---|---|---|---|
| `GET` | `/api/health` | Service health status & telemetry sync | Returns service uptime, Gemini configuration state, active floats count |
| `GET` | `/api/argo/floats` | Retrieves real-time enriched ARGO ocean floats | `?basin=Arabian+Sea` & `?minRisk=HIGH_RISK` |
| `GET` | `/api/argo/ports` | Retrieves coastal ports, harbors, and stations | Returns harbor coordinates, local languages, and MRCC stations |
| `POST` | `/api/gemini/chat` | AI advisory engine grounded on live ocean metrics | `{ "message": "Can I sail tonight?", "context": { "villageName": "Kasimedu", ... } }` |
| `POST` | `/api/emergency/broadcast` | Generates distress SMS & VHF telegrams | `{ "captainName": "Murugesan", "phone": "+91 94440 15540", ... }` |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Leaflet Maps, Web Audio API
- **Backend**: Node.js, Express, Google GenAI SDK (`@google/genai`), esbuild, tsx
- **Audio & Signal Synthesis**: Web Audio API (Dual-Tone Oscillators & Bandpass Squelch Filters), Web Speech API
- **Geolocation & Navigation**: Browser Geolocation API, Haversine & Geodesic Navigation Algorithms
- **Data Persistence**: Offline-first LocalStorage with GSM & Telex buffering

---

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Run in Development
```bash
npm run dev
```
The server will start on port `3000`.

### Build for Production
```bash
npm run build
```

---

## 📞 Emergency Maritime Contacts (India)

| Authority / Station | Channel / Frequency | Emergency Contact |
|---|---|---|
| **Indian Coast Guard (MRCC)** | VHF Ch 16 / DSC Ch 70 | **1554** (Toll-Free 24x7) |
| **Chennai Coastal Radio (VWM)** | 156.800 MHz / 2182 kHz | `+91-44-23460405` |
| **Kochi Coastal Radio (VWN)** | 156.800 MHz / 2182 kHz | `+91-484-2216444` |
| **Mangalore Coastal Radio (VWO)** | 156.800 MHz / 2182 kHz | `+91-824-2405266` |
| **Mumbai MRCC (VWE)** | 156.800 MHz / 2182 kHz | `+91-22-24388065` |
| **Vizag Coastal Radio (VXV)** | 156.800 MHz / 2182 kHz | `+91-891-2565154` |
| **National Fisheries Helpline** | GSM / Landline | `1800-425-1554` |

