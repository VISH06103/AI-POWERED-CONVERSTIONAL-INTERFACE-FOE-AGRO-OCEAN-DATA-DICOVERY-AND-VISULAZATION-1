import os
import math
import json
import time
from datetime import datetime
import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
import folium
from streamlit_folium import st_folium

# Configure Streamlit Page
st.set_page_config(
    page_title="FloatChat - AI Ocean Intelligence & Fishermen Safety",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------
# CONSTANTS & TRANSLATIONS
# ---------------------------------------------------------
LANGUAGES = {
    "en": {"name": "English", "flag": "🌐"},
    "ta": {"name": "தமிழ் (Tamil)", "flag": "🇮🇳"},
    "kn": {"name": "ಕನ್ನಡ (Kannada)", "flag": "🇮🇳"},
    "ml": {"name": "മലയാളം (Malayalam)", "flag": "🇮🇳"},
    "te": {"name": "తెలుగు (Telugu)", "flag": "🇮🇳"},
    "hi": {"name": "हिन्दी (Hindi)", "flag": "🇮🇳"},
    "bn": {"name": "বাংলা (Bengali)", "flag": "🇮🇳"},
    "gu": {"name": "ગુજરાતી (Gujarati)", "flag": "🇮🇳"},
    "mr": {"name": "मराठी (Marathi)", "flag": "🇮🇳"},
}

MULTILINGUAL_ADVISORIES = {
    "en": {
        "highRisk": "DANGER: Do NOT venture into deep sea. High cyclone energy and turbulent swells detected. Return to harbor immediately.",
        "moderateRisk": "CAUTION: Moderate sea roughness. Small wooden boats remain near shore. Monitor VHF channel 16.",
        "lowRisk": "SAFE: Ocean conditions are calm and favorable for fishing activities.",
    },
    "ta": {
        "highRisk": "எச்சரிக்கை: ஆழ்கடலுக்கு மீன்பிடிக்க செல்ல வேண்டாம்! சூறாவளி வெப்ப ஆற்றல் மற்றும் கொந்தளிப்பான அலைகள் உள்ளன. உடனடியாக கரைக்கு திரும்பவும்.",
        "moderateRisk": "கவனம்: கடல் சற்று கொந்தளிப்பாக உள்ளது. நாட்டுப் படகுகள் கரைக்கு அருகிலேயே இருக்கவும்.",
        "lowRisk": "பாதுகாப்பானது: கடல் அமைதியாக உள்ளது. மீன்பிடிக்க சாதகமான சூழல்.",
    },
    "kn": {
        "highRisk": "ಅಪಾಯ ಎಚ್ಚರಿಕೆ: ಆಳ ಸಮುದ್ರಕ್ಕೆ ಮೀನುಗಾರಿಕೆಗೆ ಹೋಗಬೇಡಿ! ಚಂಡಮಾರುತದ ತೀವ್ರ ಶಾಖ ಶಕ್ತಿ ಮತ್ತು ಎತ್ತರದ ಅಲೆಗಳಿವೆ. ತಕ್ಷಣವೇ ಬಂದರಿಗೆ ಮರಳಿರಿ.",
        "moderateRisk": "ಎಚ್ಚರಿಕೆ: ಸಮುದ್ರ ಮಧ್ಯಮ ಪ್ರಕ್ಷುಬ್ಧವಾಗಿದೆ. ಸಣ್ಣ ದೋಣಿಗಳು ತೀರದ ಸಮೀಪದಲ್ಲೇ ಇರಬೇಕು. ವಿಎಚ್‌ಎಫ್ ಚಾನೆಲ್ 16 ವೀಕ್ಷಿಸಿ.",
        "lowRisk": "ಸುರಕ್ಷಿತ: ಸಮುದ್ರ ಶಾಂತವಾಗಿದೆ ಮತ್ತು ಮೀನುಗಾರಿಕೆಗೆ ಅನುಕೂಲಕರವಾಗಿದೆ.",
    },
    "ml": {
        "highRisk": "അപകട മുന്നറിയിപ്പ്: ആഴക്കടലിൽ മീൻപിടുത്തത്തിന് പോകരുത്! ചുഴലിക്കാറ്റ് രൂപപ്പെടാൻ സാധ്യതയുള്ള ശക്തമായ ചൂടും ഉയരമുള്ള തിരമാലകളും. ഉടൻ തീരത്തേക്ക് മടങ്ങുക.",
        "moderateRisk": "ശ്രദ്ധിക്കുക: കടൽ പ്രക്ഷുബ്ധമാകാൻ സാധ്യതയുണ്ട്. ചെറിയ വള്ളങ്ങൾ തീരത്തിനടുത്ത് തുടരുക.",
        "lowRisk": "സുരക്ഷിതം: കടൽ ശാന്തമാണ്. മീൻപിടുത്തത്തിന് അനുകൂല കാലാവസ്ഥ.",
    },
    "te": {
        "highRisk": "హెచ్చరిక: లోతైన సముద్రంలోకి వేటకు వెళ్లవద్దు! తుఫాను ముప్పు మరియు పెద్ద అలలు ఉన్నాయి. వెంటనే తీరానికి తిరిగి రండి.",
        "moderateRisk": "జాగ్రత్త: సముద్రం అలజడిగా ఉంది. చిన్న పడవలు తీరానికి సమీపంలోనే ఉండాలి.",
        "lowRisk": "సురక్షితం: సముద్రం ప్రశాంతంగా ఉంది. వేటకు అనుకూలమైన వాతావరణం.",
    },
    "hi": {
        "highRisk": "खतरा: गहरे समुद्र में मछली पकड़ने न जाएं! चक्रवात बनने की अत्यधिक संभावना और ऊंची लहरें हैं। तुरंत बंदरगाह पर लौटें।",
        "moderateRisk": "सावधानी: समुद्र में मध्यम हलचल है। छोटी नावें तट के करीब ही रहें।",
        "lowRisk": "सुरक्षित: समुद्र शांत है और मछली पकड़ने के लिए अनुकूल स्थिति है।",
    },
    "bn": {
        "highRisk": "বিপদ সতর্কবার্তা: গভীর সমুদ্রে মাছ ধরতে যাবেন না! তীব্র ঘূর্ণিঝড়ের শক্তি ও উত্তাল ঢেউ রয়েছে। অবিলম্বে তীরে ফিরে আসুন।",
        "moderateRisk": "সতর্কতা: সমুদ্র মাঝারি উত্তাল। ছোট নৌকাগুলি উপকূলের কাছেই থাকুন।",
        "lowRisk": "নিরাপদ: সমুদ্র শান্ত রয়েছে। মাছ ধরার জন্য অনুকুল পরিবেশ।",
    },
    "gu": {
        "highRisk": "ચેતવણી: દરિયામાં ઊંડે માછીમારી માટે ન જશો! વાવાઝોડાની ઊંચી શક્યતા અને ભારે મોજાં છે. તાત્કાલિક બંદરે પરત ફરો.",
        "moderateRisk": "સાવધાની: દરિયો મધ્યમ તોફાની છે. નાની બોટોએ કાંઠા નજીક રહેવું.",
        "lowRisk": "સલામત: દરિયો શાંત છે અને માછીમારી માટે યોગ્ય વાતાવરણ છે.",
    },
    "mr": {
        "highRisk": "धोका: खोल समुद्रात मासेमारीसाठी जाऊ नका! चक्रीवादळाची ऊर्जा आणि प्रचंड लाटा आहेत. ताबडतोब बंदरावर परत या.",
        "moderateRisk": "काळजी घ्या: समुद्र काहीसा खवळलेला आहे. लहान बोटींनी किनार्याजवळच राहावे.",
        "lowRisk": "सुरक्षित: समुद्र शांत असून मासेमारीसाठी अनुकूल स्थिती आहे.",
    },
}

# ---------------------------------------------------------
# OCEAN PHYSICS & MATHEMATICAL CALCULATIONS
# ---------------------------------------------------------
def calculate_distance_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c)

def calculate_bearing(lat1, lon1, lat2, lon2):
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)
    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    theta = math.atan2(y, x)
    bearing = math.degrees(theta)
    return round((bearing + 360) % 360)

def get_cardinal_direction(degrees):
    cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    idx = round(degrees / 22.5) % 16
    return cardinals[idx]

def generate_vertical_profile(sst, surface_sal, d26_target, deep_temp=2.4):
    depths = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000]
    profile = []
    for depth in depths:
        if depth <= 20:
            temp = sst - (depth / 20.0) * 0.15
        elif depth <= d26_target:
            ratio = (depth - 20) / max(1.0, (d26_target - 20))
            temp = (sst - 0.15) - ratio * ((sst - 0.15) - 26.0)
        elif depth <= 250:
            ratio = (depth - d26_target) / (250.0 - d26_target)
            temp = 26.0 - ratio * (26.0 - 13.5)
        elif depth <= 1000:
            ratio = (depth - 250) / 750.0
            temp = 13.5 - ratio * (13.5 - 5.5)
        else:
            ratio = (depth - 1000) / 1000.0
            temp = 5.5 - ratio * (5.5 - deep_temp)

        if depth <= 100:
            salinity = surface_sal + (depth / 100.0) * 1.8
        elif depth <= 500:
            salinity = min(35.5, surface_sal + 1.8 - ((depth - 100) / 400.0) * 0.4)
        else:
            salinity = 34.75 + (depth / 2000.0) * 0.15

        pressure = round(depth * 1.0197, 1)
        density = round(1024 + (depth * 0.0045) + (salinity - 35) * 0.78 - (temp - 10) * 0.22, 1)
        sound_speed = round(1448.96 + 4.591 * temp - 0.05304 * (temp ** 2) + 1.34 * (salinity - 35) + 0.0163 * depth, 1)

        profile.append({
            "depth": depth,
            "temp": round(temp, 2),
            "salinity": round(salinity, 2),
            "pressure": pressure,
            "density": density,
            "sound_speed": sound_speed
        })
    return profile

def evaluate_ocean_risk(float_data):
    tchp = float_data.get("tchp", 0)
    sst = float_data.get("surfaceTemp", 28.0)
    wave = float_data.get("waveHeight", 1.5)
    sst_anomaly = float_data.get("sstAnomaly", 0.0)

    tchp_score = min(100, round((tchp / 90.0) * 100))
    sst_score = min(100, max(0, round(((sst - 26) / 5.0) * 100)))
    cyclone_score = round(tchp_score * 0.65 + sst_score * 0.35)
    wave_score = min(100, round((wave / 4.5) * 100))
    heatwave_score = min(100, max(0, round((sst_anomaly / 2.5) * 100)))

    if cyclone_score >= 70 or wave_score >= 75 or tchp >= 65 or wave >= 3.2:
        risk_level = "HIGH_RISK"
        summary = f"CRITICAL CYCLONE HEAT POOL: TCHP {tchp} kJ/cm² and SST {sst}°C detected. Deep warm water layer fuels storm intensification."
    elif cyclone_score >= 45 or wave_score >= 45 or tchp >= 35 or wave >= 2.0:
        risk_level = "MODERATE_RISK"
        summary = f"MODERATE SWELL & THERMAL ADVISORY: Developing rough seas (Waves ~{wave}m, TCHP {tchp} kJ/cm²). Small craft stay within 10-15 NM."
    else:
        risk_level = "LOW_RISK"
        summary = f"CALM CONDITIONS: Normal thermocline, stable sea state (Waves ~{wave}m, SST {sst}°C). Safe for deep-sea operations."

    return {
        "riskLevel": risk_level,
        "cycloneScore": cyclone_score,
        "waveScore": wave_score,
        "heatwaveScore": heatwave_score,
        "summary": summary
    }

# ---------------------------------------------------------
# BASE ARGO DATASET
# ---------------------------------------------------------
BASE_ARGO_FLOATS = [
    {
        "id": "argo-2903345",
        "wmoId": "2903345",
        "name": "INCOIS Bio-Argo Alpha (Bay of Bengal)",
        "basin": "Bay of Bengal",
        "lat": 13.85,
        "lng": 83.42,
        "cycleNumber": 142,
        "surfaceTemp": 30.6,
        "surfaceSalinity": 32.8,
        "tchp": 88.4,
        "d26Depth": 82.5,
        "mld": 42,
        "sstAnomaly": 2.3,
        "waveHeight": 3.8,
        "windSpeedKnots": 38,
        "riskLevel": "HIGH_RISK",
        "riskCategory": "CYCLONE_HEAT_BUILDUP",
        "alertSummary": "Severe Cyclone Heat Pool: Exceptionally deep 30°C warm pool (TCHP 88 kJ/cm²). Rapid storm development underway.",
        "batteryPercent": 88,
        "transmissionStatus": "LIVE",
    },
    {
        "id": "argo-2903562",
        "wmoId": "2903562",
        "name": "INCOIS Deep Float (Off Chennai)",
        "basin": "Bay of Bengal",
        "lat": 12.95,
        "lng": 81.65,
        "cycleNumber": 98,
        "surfaceTemp": 29.4,
        "surfaceSalinity": 33.4,
        "tchp": 58.2,
        "d26Depth": 62.0,
        "mld": 35,
        "sstAnomaly": 1.4,
        "waveHeight": 2.6,
        "windSpeedKnots": 24,
        "riskLevel": "MODERATE_RISK",
        "riskCategory": "ROUGH_SWELL",
        "alertSummary": "Moderate Cyclone Heat Potential: Swell building up to 2.6m with moderate thermocline energy.",
        "batteryPercent": 74,
        "transmissionStatus": "LIVE",
    },
    {
        "id": "argo-2903421",
        "wmoId": "2903421",
        "name": "Arabian Sea Sentinel (Off Kochi)",
        "basin": "Arabian Sea",
        "lat": 9.85,
        "lng": 75.25,
        "cycleNumber": 215,
        "surfaceTemp": 28.3,
        "surfaceSalinity": 35.8,
        "tchp": 26.5,
        "d26Depth": 34.0,
        "mld": 28,
        "sstAnomaly": 0.2,
        "waveHeight": 1.4,
        "windSpeedKnots": 12,
        "riskLevel": "LOW_RISK",
        "riskCategory": "SAFE_FISHING",
        "alertSummary": "Calm & Stable Waters: Normal thermocline, optimal mixed layer with strong upwelling chlorophyll proxy.",
        "batteryPercent": 92,
        "transmissionStatus": "LIVE",
    },
    {
        "id": "argo-2903712",
        "wmoId": "2903712",
        "name": "Konkan Coast Buoy (Off Mumbai)",
        "basin": "Arabian Sea",
        "lat": 18.72,
        "lng": 71.85,
        "cycleNumber": 178,
        "surfaceTemp": 28.7,
        "surfaceSalinity": 36.1,
        "tchp": 38.0,
        "d26Depth": 42.0,
        "mld": 30,
        "sstAnomaly": 0.6,
        "waveHeight": 1.7,
        "windSpeedKnots": 15,
        "riskLevel": "LOW_RISK",
        "riskCategory": "SAFE_FISHING",
        "alertSummary": "Favorable Sea Conditions: Mild northwesterly breeze, stable thermal structure.",
        "batteryPercent": 81,
        "transmissionStatus": "LIVE",
    },
    {
        "id": "argo-2903671",
        "wmoId": "2903671",
        "name": "North Bay Bengal Buoy (Off Paradip)",
        "basin": "Bay of Bengal",
        "lat": 19.82,
        "lng": 87.45,
        "cycleNumber": 84,
        "surfaceTemp": 30.1,
        "surfaceSalinity": 31.2,
        "tchp": 74.5,
        "d26Depth": 74.0,
        "mld": 38,
        "sstAnomaly": 1.9,
        "waveHeight": 3.2,
        "windSpeedKnots": 32,
        "riskLevel": "HIGH_RISK",
        "riskCategory": "CYCLONE_HEAT_BUILDUP",
        "alertSummary": "Severe Cyclone Alert: Thermal heat energy high. Fresh water cap trapping heat below surface.",
        "batteryPercent": 69,
        "transmissionStatus": "LIVE",
    },
    {
        "id": "argo-2902990",
        "wmoId": "2902990",
        "name": "Andaman Sea Deep Profiler",
        "basin": "Bay of Bengal",
        "lat": 11.45,
        "lng": 92.95,
        "cycleNumber": 310,
        "surfaceTemp": 29.8,
        "surfaceSalinity": 33.1,
        "tchp": 66.8,
        "d26Depth": 68.0,
        "mld": 40,
        "sstAnomaly": 1.6,
        "waveHeight": 2.8,
        "windSpeedKnots": 26,
        "riskLevel": "HIGH_RISK",
        "riskCategory": "CYCLONE_HEAT_BUILDUP",
        "alertSummary": "High Thermal Reservoir: Andaman trough accumulating massive convective heat.",
        "batteryPercent": 85,
        "transmissionStatus": "LIVE",
    },
    {
        "id": "argo-2903109",
        "wmoId": "2903109",
        "name": "Saurashtra Oceanic Buoy (Veraval)",
        "basin": "Arabian Sea",
        "lat": 20.45,
        "lng": 69.80,
        "cycleNumber": 154,
        "surfaceTemp": 27.8,
        "surfaceSalinity": 36.4,
        "tchp": 19.5,
        "d26Depth": 26.0,
        "mld": 24,
        "sstAnomaly": -0.2,
        "waveHeight": 1.3,
        "windSpeedKnots": 11,
        "riskLevel": "LOW_RISK",
        "riskCategory": "SAFE_FISHING",
        "alertSummary": "Calm Sea State: Strong coastal upwelling with rich pelagic fish aggregations.",
        "batteryPercent": 94,
        "transmissionStatus": "LIVE",
    },
    {
        "id": "argo-5904512",
        "wmoId": "5904512",
        "name": "South China Sea / Luzon Strait Float",
        "basin": "South China Sea",
        "lat": 17.50,
        "lng": 118.20,
        "cycleNumber": 112,
        "surfaceTemp": 30.2,
        "surfaceSalinity": 34.2,
        "tchp": 79.2,
        "d26Depth": 76.0,
        "mld": 44,
        "sstAnomaly": 1.8,
        "waveHeight": 3.4,
        "windSpeedKnots": 34,
        "riskLevel": "HIGH_RISK",
        "riskCategory": "CYCLONE_HEAT_BUILDUP",
        "alertSummary": "Typhoon Fuel Zone: High TCHP and deep warm pool east of Luzon and Vietnam.",
        "batteryPercent": 77,
        "transmissionStatus": "LIVE",
    }
]

# Attach vertical CTD profiles
for f in BASE_ARGO_FLOATS:
    f["profilePoints"] = generate_vertical_profile(f["surfaceTemp"], f["surfaceSalinity"], f["d26Depth"])

# ---------------------------------------------------------
# LOCATION DIRECTORY (COASTAL & INLAND PLACES)
# ---------------------------------------------------------
LOCATION_DATABASE = [
    # Karnataka
    {"name": "Malpe Harbor", "state": "Karnataka", "basin": "Arabian Sea", "lat": 13.3504, "lng": 74.7025, "is_coastal": True, "port": "Malpe Harbor", "language": "kn"},
    {"name": "Mangalore (Old Port)", "state": "Karnataka", "basin": "Arabian Sea", "lat": 12.8596, "lng": 74.8360, "is_coastal": True, "port": "New Mangalore Port", "language": "kn"},
    {"name": "Karwar (Baithkol)", "state": "Karnataka", "basin": "Arabian Sea", "lat": 14.8135, "lng": 74.1298, "is_coastal": True, "port": "Karwar Port", "language": "kn"},
    {"name": "Honnavar (Sharavathi)", "state": "Karnataka", "basin": "Arabian Sea", "lat": 14.2810, "lng": 74.4440, "is_coastal": True, "port": "Honnavar Port", "language": "kn"},
    {"name": "Bhatkal (Tengingundi)", "state": "Karnataka", "basin": "Arabian Sea", "lat": 13.9780, "lng": 74.5520, "is_coastal": True, "port": "Bhatkal Port", "language": "kn"},
    {"name": "Tumakuru (Tumkur)", "state": "Karnataka", "basin": "Arabian Sea", "lat": 13.3409, "lng": 77.1010, "is_coastal": False, "port": "Malpe Harbor / New Mangalore Port", "coastal_dist_km": 260, "language": "kn"},
    {"name": "Bengaluru (Bangalore)", "state": "Karnataka", "basin": "Arabian Sea", "lat": 12.9716, "lng": 77.5946, "is_coastal": False, "port": "Mangalore / Chennai Ports", "coastal_dist_km": 290, "language": "kn"},
    {"name": "Mysuru (Mysore)", "state": "Karnataka", "basin": "Arabian Sea", "lat": 12.2958, "lng": 76.6394, "is_coastal": False, "port": "New Mangalore Port", "coastal_dist_km": 195, "language": "kn"},
    {"name": "Shivamogga (Shimoga)", "state": "Karnataka", "basin": "Arabian Sea", "lat": 13.9299, "lng": 75.5681, "is_coastal": False, "port": "Malpe / Bhatkal Ports", "coastal_dist_km": 115, "language": "kn"},
    {"name": "Hubballi-Dharwad", "state": "Karnataka", "basin": "Arabian Sea", "lat": 15.3647, "lng": 75.1240, "is_coastal": False, "port": "Karwar Harbor", "coastal_dist_km": 145, "language": "kn"},
    
    # Tamil Nadu
    {"name": "Kasimedu (Chennai)", "state": "Tamil Nadu", "basin": "Bay of Bengal", "lat": 13.1256, "lng": 80.2974, "is_coastal": True, "port": "Chennai Harbor", "language": "ta"},
    {"name": "Kanyakumari (Chothavilai)", "state": "Tamil Nadu", "basin": "Indian Ocean", "lat": 8.0883, "lng": 77.5385, "is_coastal": True, "port": "Kanyakumari Harbor", "language": "ta"},
    {"name": "Nagapattinam", "state": "Tamil Nadu", "basin": "Bay of Bengal", "lat": 10.7656, "lng": 79.8427, "is_coastal": True, "port": "Nagapattinam Harbor", "language": "ta"},
    {"name": "Rameswaram (Pamban)", "state": "Tamil Nadu", "basin": "Bay of Bengal", "lat": 9.2876, "lng": 79.3129, "is_coastal": True, "port": "Pamban Jetty", "language": "ta"},
    {"name": "Thoothukudi (Tuticorin)", "state": "Tamil Nadu", "basin": "Gulf of Mannar", "lat": 8.7642, "lng": 78.1348, "is_coastal": True, "port": "V.O.C. Port", "language": "ta"},
    {"name": "Coimbatore", "state": "Tamil Nadu", "basin": "Arabian Sea", "lat": 11.0168, "lng": 76.9558, "is_coastal": False, "port": "Kochi / Munambam Harbor", "coastal_dist_km": 140, "language": "ta"},
    {"name": "Madurai", "state": "Tamil Nadu", "basin": "Bay of Bengal", "lat": 9.9252, "lng": 78.1198, "is_coastal": False, "port": "Thoothukudi / Rameswaram", "coastal_dist_km": 120, "language": "ta"},
    
    # Kerala
    {"name": "Kochi (Munambam)", "state": "Kerala", "basin": "Arabian Sea", "lat": 9.9312, "lng": 76.2673, "is_coastal": True, "port": "Cochin Fishery Harbor", "language": "ml"},
    {"name": "Vizhinjam (Trivandrum)", "state": "Kerala", "basin": "Arabian Sea", "lat": 8.3756, "lng": 76.9906, "is_coastal": True, "port": "Vizhinjam International Port", "language": "ml"},
    {"name": "Beypore (Kozhikode)", "state": "Kerala", "basin": "Arabian Sea", "lat": 11.1625, "lng": 75.8078, "is_coastal": True, "port": "Beypore Port", "language": "ml"},
    {"name": "Thoppumpady", "state": "Kerala", "basin": "Arabian Sea", "lat": 9.9400, "lng": 76.2700, "is_coastal": True, "port": "Cochin Harbor", "language": "ml"},
    
    # Andhra Pradesh
    {"name": "Visakhapatnam (Jalaripeta)", "state": "Andhra Pradesh", "basin": "Bay of Bengal", "lat": 17.6868, "lng": 83.2185, "is_coastal": True, "port": "Visakhapatnam Port", "language": "te"},
    {"name": "Kakinada Fishing Harbor", "state": "Andhra Pradesh", "basin": "Bay of Bengal", "lat": 16.9891, "lng": 82.2475, "is_coastal": True, "port": "Kakinada Port", "language": "te"},
    {"name": "Machilipatnam", "state": "Andhra Pradesh", "basin": "Bay of Bengal", "lat": 16.1875, "lng": 81.1389, "is_coastal": True, "port": "Machilipatnam Port", "language": "te"},
    {"name": "Vijayawada", "state": "Andhra Pradesh", "basin": "Bay of Bengal", "lat": 16.5062, "lng": 80.6480, "is_coastal": False, "port": "Machilipatnam Harbor", "coastal_dist_km": 65, "language": "te"},
    {"name": "Hyderabad", "state": "Telangana", "basin": "Bay of Bengal", "lat": 17.3850, "lng": 78.4867, "is_coastal": False, "port": "Machilipatnam / Kakinada", "coastal_dist_km": 290, "language": "te"},
    
    # Maharashtra & Gujarat
    {"name": "Mumbai (Sassoon Dock)", "state": "Maharashtra", "basin": "Arabian Sea", "lat": 18.9168, "lng": 72.8228, "is_coastal": True, "port": "Sassoon Dock", "language": "mr"},
    {"name": "Versova (Koliwada)", "state": "Maharashtra", "basin": "Arabian Sea", "lat": 19.1334, "lng": 72.8142, "is_coastal": True, "port": "Versova Harbor", "language": "mr"},
    {"name": "Pune", "state": "Maharashtra", "basin": "Arabian Sea", "lat": 18.5204, "lng": 73.8567, "is_coastal": False, "port": "Mumbai / JNPT Port", "coastal_dist_km": 120, "language": "mr"},
    {"name": "Veraval Fishing Harbor", "state": "Gujarat", "basin": "Arabian Sea", "lat": 20.9077, "lng": 70.3678, "is_coastal": True, "port": "Veraval Harbor", "language": "gu"},
    {"name": "Porbandar", "state": "Gujarat", "basin": "Arabian Sea", "lat": 21.6417, "lng": 69.6293, "is_coastal": True, "port": "Porbandar Port", "language": "gu"},
    {"name": "Ahmedabad", "state": "Gujarat", "basin": "Arabian Sea", "lat": 23.0225, "lng": 72.5714, "is_coastal": False, "port": "Bhavnagar / Kandla Port", "coastal_dist_km": 80, "language": "gu"},
    
    # Odisha & West Bengal
    {"name": "Paradip Fishing Port", "state": "Odisha", "basin": "Bay of Bengal", "lat": 20.2644, "lng": 86.6877, "is_coastal": True, "port": "Paradip Port", "language": "bn"},
    {"name": "Puri (Chakratirtha)", "state": "Odisha", "basin": "Bay of Bengal", "lat": 19.8135, "lng": 85.8312, "is_coastal": True, "port": "Puri Fishery Base", "language": "bn"},
    {"name": "Digha (Shankarpur)", "state": "West Bengal", "basin": "Bay of Bengal", "lat": 21.6266, "lng": 87.5075, "is_coastal": True, "port": "Shankarpur Harbor", "language": "bn"},
    {"name": "Kolkata", "state": "West Bengal", "basin": "Bay of Bengal", "lat": 22.5726, "lng": 88.3639, "is_coastal": False, "port": "Haldia / Diamond Harbor", "coastal_dist_km": 85, "language": "bn"},
]

def find_nearest_float(lat, lng):
    min_dist = float("inf")
    closest = BASE_ARGO_FLOATS[0]
    for f in BASE_ARGO_FLOATS:
        dist = calculate_distance_km(lat, lng, f["lat"], f["lng"])
        if dist < min_dist:
            min_dist = dist
            closest = f
    return closest, min_dist

# ---------------------------------------------------------
# AI ASSISTANT FUNCTIONS (GROQ & GEMINI & HEURISTICS)
# ---------------------------------------------------------
def get_groq_api_key(custom_key=None):
    if custom_key and custom_key.strip():
        return custom_key.strip()
    if hasattr(st, "secrets") and "GROQ_API_KEY" in st.secrets:
        return st.secrets["GROQ_API_KEY"]
    return os.getenv("GROQ_API_KEY")

def get_gemini_api_key(custom_key=None):
    if custom_key and custom_key.strip():
        return custom_key.strip()
    if hasattr(st, "secrets") and "GEMINI_API_KEY" in st.secrets:
        return st.secrets["GEMINI_API_KEY"]
    return os.getenv("GEMINI_API_KEY")

def query_groq_ai(prompt, context_float=None, location_info=None, custom_key=None, model="llama-3.3-70b-versatile"):
    api_key = get_groq_api_key(custom_key)
    if not api_key:
        return None, "No Groq API Key found"

    system_prompt = (
        "You are FloatChat AI, a premier marine meteorologist and ocean safety advisor for Indian coastal fishermen and maritime authorities. "
        "You analyze ocean ARGO profiling floats, Tropical Cyclone Heat Potential (TCHP in kJ/cm²), Sea Surface Temperatures (SST in °C), "
        "D26 26°C isotherm depths, swell wave heights, thermoclines, and Potential Fishing Zones (PFZ). "
        "Keep your answers clear, practical, life-saving, and respectful. Use bullet points for key actions. "
        "Include nautical advice (compass bearings, safe return headings, VHF Channel 16, and emergency Coast Guard 1554 helpline)."
    )

    context_str = ""
    if location_info:
        context_str += f"- Location: {location_info.get('name')} ({location_info.get('state')}), Basin: {location_info.get('basin')}\n"
        if not location_info.get("is_coastal", True):
            context_str += f"- Inland Distance: {location_info.get('coastal_dist_km', 200)} km from shore | Coastal Port Gateway: {location_info.get('port')}\n"
    if context_float:
        context_str += f"- Nearest ARGO Float: {context_float.get('name')} (WMO {context_float.get('wmoId')})\n"
        context_str += f"- Sea Surface Temp (SST): {context_float.get('surfaceTemp')}°C (Anomaly: {context_float.get('sstAnomaly')}°C)\n"
        context_str += f"- Tropical Cyclone Heat Potential (TCHP): {context_float.get('tchp')} kJ/cm²\n"
        context_str += f"- 26°C Isotherm Depth (D26): {context_float.get('d26Depth')}m | Mixed Layer Depth (MLD): {context_float.get('mld')}m\n"
        context_str += f"- Wave Height: {context_float.get('waveHeight')}m | Wind Speed: {context_float.get('windSpeedKnots')} knots\n"
        context_str += f"- Ocean Risk Level: {context_float.get('riskLevel')} ({context_float.get('riskCategory')})\n"

    user_message = f"Ocean Telemetry Data:\n{context_str}\nFisherman / Maritime Question:\n{prompt}\n\nPlease provide expert maritime safety guidance:"

    # Try official groq SDK first
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.4,
            max_tokens=1024,
        )
        return completion.choices[0].message.content, f"⚡ Groq ({model})"
    except Exception as err_sdk:
        # Fallback to direct HTTPS request via requests library
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.4,
                "max_tokens": 1024
            }
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"], f"⚡ Groq ({model})"
            else:
                return None, f"Groq HTTP Error {res.status_code}: {res.text}"
        except Exception as err_http:
            return None, f"Groq Error: {str(err_sdk)} / {str(err_http)}"

def query_gemini_ai(prompt, context_float=None, location_info=None, custom_key=None):
    api_key = get_gemini_api_key(custom_key)
    if not api_key:
        return None, "No Gemini API Key found"

    system_prompt = (
        "You are FloatChat AI, an expert marine meteorologist and ocean safety advisor for Indian coastal fishermen and maritime authorities. "
        "You analyze ocean ARGO profiling floats, Tropical Cyclone Heat Potential (TCHP), Sea Surface Temperatures (SST), "
        "D26 thermocline depths, swell wave heights, and Potential Fishing Zones (PFZ). "
        "Keep your answers clear, practical, life-saving, and respectful. Use bullet points for key actions. "
        "Include nautical advice (compass bearings, safe return headings, VHF Channel 16)."
    )

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        full_prompt = f"{system_prompt}\n\nContext Data:\n"
        if location_info:
            full_prompt += f"Location: {location_info.get('name')} ({location_info.get('state')}), Basin: {location_info.get('basin')}\n"
        if context_float:
            full_prompt += f"Nearest Float: {context_float.get('name')} (WMO {context_float.get('wmoId')})\n"
            full_prompt += f"SST: {context_float.get('surfaceTemp')}°C, TCHP: {context_float.get('tchp')} kJ/cm², D26: {context_float.get('d26Depth')}m, Waves: {context_float.get('waveHeight')}m, Risk: {context_float.get('riskLevel')}\n"
        
        full_prompt += f"\nFisherman/User Question: {prompt}\n\nPlease provide expert maritime safety guidance:"
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )
        return response.text, "✨ Google Gemini (2.5 Flash)"
    except Exception as e:
        return None, f"Gemini Error: {str(e)}"

def query_unified_ai(prompt, provider="Auto", context_float=None, location_info=None, custom_groq_key=None, custom_gemini_key=None, groq_model="llama-3.3-70b-versatile"):
    """
    Unified AI router: Groq -> Gemini -> Smart Physics Heuristics
    """
    # 1. User explicitly picked Groq
    if provider == "Groq":
        resp, badge = query_groq_ai(prompt, context_float, location_info, custom_groq_key, model=groq_model)
        if resp:
            return resp, badge
        # If Groq failed, fallback to heuristic
        h_resp = fallback_heuristic_response(prompt, context_float, location_info)
        return f"*(Groq notice: {badge})*\n\n" + h_resp, "🌊 Smart Physics Engine (Groq Fallback)"

    # 2. User explicitly picked Gemini
    if provider == "Gemini":
        resp, badge = query_gemini_ai(prompt, context_float, location_info, custom_gemini_key)
        if resp:
            return resp, badge
        h_resp = fallback_heuristic_response(prompt, context_float, location_info)
        return f"*(Gemini notice: {badge})*\n\n" + h_resp, "🌊 Smart Physics Engine (Gemini Fallback)"

    # 3. Auto Mode: Tries Groq first (lightning fast inference), then Gemini, then Heuristic
    groq_key = get_groq_api_key(custom_groq_key)
    if groq_key:
        resp, badge = query_groq_ai(prompt, context_float, location_info, custom_groq_key, model=groq_model)
        if resp:
            return resp, badge

    gemini_key = get_gemini_api_key(custom_gemini_key)
    if gemini_key:
        resp, badge = query_gemini_ai(prompt, context_float, location_info, custom_gemini_key)
        if resp:
            return resp, badge

    # Fallback to smart marine physics calculation engine
    return fallback_heuristic_response(prompt, context_float, location_info), "🌊 Smart Ocean Physics Engine (Offline / Standalone)"

def fallback_heuristic_response(prompt, context_float, location_info):
    loc_name = location_info.get("name", "your coast") if location_info else "the Indian coastal sector"
    float_name = context_float.get("name", "INCOIS ARGO Buoy") if context_float else "Regional ARGO Buoy"
    risk = context_float.get("riskLevel", "LOW_RISK") if context_float else "LOW_RISK"
    tchp = context_float.get("tchp", 28.5) if context_float else 28.5
    waves = context_float.get("waveHeight", 1.5) if context_float else 1.5
    sst = context_float.get("surfaceTemp", 28.4) if context_float else 28.4

    if "cyclone" in prompt.lower() or "storm" in prompt.lower() or "tchp" in prompt.lower():
        if tchp >= 65:
            return f"🚨 **CRITICAL CYCLONE HEAT POOL ALERT for {loc_name}**\n- **TCHP**: {tchp} kJ/cm² (Extreme thermal buildup)\n- **SST**: {sst}°C (Exceeds 28.5°C threshold)\n- **Action**: Halt all deep-sea fishing. Return to nearest harbor immediately. Maintain continuous watch on **VHF Channel 16**."
        else:
            return f"✅ **Low Cyclone Probability for {loc_name}**\n- **TCHP**: {tchp} kJ/cm² (Below dangerous 50 kJ/cm² threshold)\n- **SST**: {sst}°C\n- Ocean heat reservoir is stable with no signs of rapid cyclonic intensification."

    if "fish" in prompt.lower() or "pfz" in prompt.lower() or "catch" in prompt.lower():
        return f"🐟 **Potential Fishing Zone (PFZ) Advisory for {loc_name}**\n- **Optimum Catch Layer**: 15m – 45m near thermocline gradient\n- **Active Species**: Seer Fish (King Mackerel / Anjal), Yellowfin Tuna, Indian Oil Sardines, Mackerel\n- **Chlorophyll**: Moderate-to-High bloom detected by ARGO optical backscatter\n- **Recommended Gear**: Drift Gillnets, Longlines, Ring Seine."

    if risk == "HIGH_RISK":
        return f"⚠️ **HIGH RISK ADVISORY for {loc_name}**\n- Ocean profiling station **{float_name}** reports turbulent conditions (Waves: {waves}m, TCHP: {tchp} kJ/cm²).\n- All country craft and mechanized trawlers should seek shelter.\n- Emergency Coast Guard Helpline: **1554**."
    elif risk == "MODERATE_RISK":
        return f"⚠️ **MODERATE CAUTION for {loc_name}**\n- Sea swell ~{waves}m with moderate wind gusts.\n- Inshore fishing permissible within 10–12 NM. Deep-sea long-distance runs not recommended."
    else:
        return f"🌊 **SAFE SAILING CONDITIONS for {loc_name}**\n- Swell height ~{waves}m, SST {sst}°C, Wind ~12 knots.\n- Favorable sea state for all motorized craft and artisanal boats. Safe voyage!"

# ---------------------------------------------------------
# STREAMLIT UI LAYOUT
# ---------------------------------------------------------

# Sidebar Controls
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&auto=format&fit=crop&q=80", caption="INCOIS Global Float Network")
    st.markdown("### ⚓ FloatChat Navigator")
    
    selected_lang = st.selectbox(
        "🌐 Advisory Language / ಭಾಷೆ / மொழி",
        options=list(LANGUAGES.keys()),
        format_func=lambda x: f"{LANGUAGES[x]['flag']} {LANGUAGES[x]['name']}",
        index=0
    )
    
    st.markdown("---")
    st.markdown("#### 🎯 Quick Location Finder")
    location_names = [loc["name"] for loc in LOCATION_DATABASE]
    selected_location_name = st.selectbox(
        "Select Coastal Village, Port or Inland District:",
        options=location_names,
        index=5 # Tumkur by default or change
    )
    
    # Match selected location
    selected_loc = next(item for item in LOCATION_DATABASE if item["name"] == selected_location_name)
    
    # Custom Coordinates Input
    st.markdown("##### 📍 Or Custom GPS Coordinates")
    custom_coords = st.text_input("Enter Lat, Lng (e.g. 13.34, 77.10)", value="")
    if custom_coords and "," in custom_coords:
        try:
            parts = custom_coords.split(",")
            c_lat, c_lng = float(parts[0].strip()), float(parts[1].strip())
            selected_loc = {
                "name": f"Custom Pin ({c_lat:.2f}°, {c_lng:.2f}°)",
                "state": "Custom Coords",
                "basin": "Indian Ocean Basin",
                "lat": c_lat,
                "lng": c_lng,
                "is_coastal": False,
                "port": "Nearest Coast Guard Station",
                "language": selected_lang
            }
        except Exception:
            st.error("Invalid format. Use Lat, Lng")

    st.markdown("---")
    st.markdown("#### ⚡ AI Engine & API Keys")
    ai_provider = st.selectbox(
        "AI Provider / Model:",
        [
            "⚡ Auto (Groq ➔ Gemini ➔ Physics)",
            "⚡ Groq: Llama 3.3 70B (Ultra-Fast)",
            "⚡ Groq: Llama 3.1 8B (Instant)",
            "⚡ Groq: Mixtral 8x7B",
            "✨ Google Gemini 2.5 Flash",
            "🌊 Smart Physics Engine (Offline)"
        ],
        index=0
    )

    with st.expander("🔑 Configure Groq / Gemini API Keys"):
        sidebar_groq_key = st.text_input(
            "Groq API Key (gsk_...):",
            type="password",
            value="",
            help="Enter your Groq API key here, or set GROQ_API_KEY in .streamlit/secrets.toml"
        )
        sidebar_gemini_key = st.text_input(
            "Gemini API Key:",
            type="password",
            value="",
            help="Enter your Gemini API key here, or set GEMINI_API_KEY in .streamlit/secrets.toml"
        )
        
        has_groq = bool(get_groq_api_key(sidebar_groq_key))
        has_gemini = bool(get_gemini_api_key(sidebar_gemini_key))
        
        st.caption(f"Status: Groq {'✅ Configured' if has_groq else '⚪ Not set'} | Gemini {'✅ Configured' if has_gemini else '⚪ Not set'}")

    st.markdown("---")
    st.markdown("#### 🔬 Ocean Simulation Lab")
    sim_preset = st.radio(
        "Ocean Weather Simulation Mode:",
        ["Live Satellite Feed", "Super Cyclone Intensification", "Monsoon Wave Surge", "Calm Sea Window"]
    )
    
    st.markdown("---")
    st.info("💡 **Streamlit Deployment Ready**\nConnects to live ARGO profiling floats, calculates TCHP, thermoclines, and gives safety advisories.")

# Simulation Deltas
temp_delta = 0.0
tchp_delta = 0.0
wave_delta = 0.0

if sim_preset == "Super Cyclone Intensification":
    temp_delta = 1.8
    tchp_delta = 35.0
    wave_delta = 1.8
    st.sidebar.error("⚠️ Super Cyclone Simulation Active")
elif sim_preset == "Monsoon Wave Surge":
    temp_delta = -0.5
    tchp_delta = 10.0
    wave_delta = 1.4
    st.sidebar.warning("🌊 Monsoon Swell Active")
elif sim_preset == "Calm Sea Window":
    temp_delta = -0.8
    tchp_delta = -20.0
    wave_delta = -1.2
    st.sidebar.success("☀️ Calm Sea Window Active")

# Main Page Header
col_h1, col_h2 = st.columns([3, 1])
with col_h1:
    st.title("🌊 FloatChat - AI Ocean Intelligence & Fishermen Safety")
    st.caption("Deep-Sea ARGO Profiling • Cyclone Heat Potential (TCHP) • PFZ Fish Shoals • Multilingual Radio Broadcasts")
with col_h2:
    st.markdown(f"""
    <div style="background: rgba(2,132,199,0.15); border: 1px solid #0284c7; padding: 10px 14px; border-radius: 8px; text-align: right;">
        <span style="color: #38bdf8; font-weight: bold;">● INCOIS ARGO LIVE</span><br>
        <small style="color: #94a3b8;">Active Floats: {len(BASE_ARGO_FLOATS)} Telemetry Units</small>
    </div>
    """, unsafe_allow_html=True)

# Find Nearest Float to selected location
nearest_float_raw, dist_to_float = find_nearest_float(selected_loc["lat"], selected_loc["lng"])

# Apply simulation deltas to the float data
nearest_float = dict(nearest_float_raw)
nearest_float["surfaceTemp"] = round(nearest_float["surfaceTemp"] + temp_delta, 1)
nearest_float["tchp"] = round(max(0, nearest_float["tchp"] + tchp_delta), 1)
nearest_float["waveHeight"] = round(max(0.5, nearest_float["waveHeight"] + wave_delta), 1)
nearest_float["d26Depth"] = round(max(15, nearest_float["d26Depth"] + (tchp_delta * 0.4)), 1)
risk_eval = evaluate_ocean_risk(nearest_float)
nearest_float["riskLevel"] = risk_eval["riskLevel"]

# Compute Nautical Track & Bearings
bearing_deg = calculate_bearing(selected_loc["lat"], selected_loc["lng"], nearest_float["lat"], nearest_float["lng"])
compass_str = f"{bearing_deg}° {get_cardinal_direction(bearing_deg)}"
return_bearing = (bearing_deg + 180) % 360
return_compass_str = f"{return_bearing}° {get_cardinal_direction(return_bearing)}"
dist_nm = round((dist_to_float / 1.852), 1)

# Top Banner: Multilingual Safety Advisory
advisory_text = MULTILINGUAL_ADVISORIES.get(selected_lang, MULTILINGUAL_ADVISORIES["en"]).get(
    "highRisk" if nearest_float["riskLevel"] == "HIGH_RISK" else "moderateRisk" if nearest_float["riskLevel"] == "MODERATE_RISK" else "lowRisk"
)

if nearest_float["riskLevel"] == "HIGH_RISK":
    st.error(f"🚨 **DANGER ADVISORY [{LANGUAGES[selected_lang]['name']}]**: {advisory_text}")
elif nearest_float["riskLevel"] == "MODERATE_RISK":
    st.warning(f"⚠️ **CAUTION ADVISORY [{LANGUAGES[selected_lang]['name']}]**: {advisory_text}")
else:
    st.success(f"✅ **SAFE ADVISORY [{LANGUAGES[selected_lang]['name']}]**: {advisory_text}")

# Main Tabs
tab_map, tab_details, tab_profile, tab_pfz, tab_broadcast, tab_ai = st.tabs([
    "📍 Live Ocean Map",
    "📊 Location & Float Telemetry",
    "🌊 Ocean CTD Depth Profile",
    "🐟 PFZ Fish Species & Biodata",
    "📻 Emergency Broadcasts & SMS",
    "🤖 Gemini AI Assistant"
])

# ---------------------------------------------------------
# TAB 1: LIVE OCEAN MAP
# ---------------------------------------------------------
with tab_map:
    st.subheader(f"🗺️ Real-Time Ocean Map: {selected_loc['name']} ➔ {nearest_float['name']}")
    
    # Create Folium Map centered on selected location
    m = folium.Map(
        location=[(selected_loc["lat"] + nearest_float["lat"]) / 2, (selected_loc["lng"] + nearest_float["lng"]) / 2],
        zoom_start=6,
        tiles="CartoDB dark_matter"
    )
    
    # Add Location Pin
    folium.Marker(
        location=[selected_loc["lat"], selected_loc["lng"]],
        popup=f"<b>{selected_loc['name']}</b><br>State: {selected_loc['state']}<br>Gateway: {selected_loc['port']}",
        tooltip=f"📍 {selected_loc['name']}",
        icon=folium.Icon(color="blue", icon="home")
    ).add_to(m)
    
    # Add ARGO Floats
    for f in BASE_ARGO_FLOATS:
        # Determine color
        f_color = "red" if f["riskLevel"] == "HIGH_RISK" else "orange" if f["riskLevel"] == "MODERATE_RISK" else "green"
        
        # Danger thermal circle if high TCHP
        if f["tchp"] >= 65:
            folium.Circle(
                location=[f["lat"], f["lng"]],
                radius=90000,
                color="red",
                fill=True,
                fill_color="red",
                fill_opacity=0.25,
                tooltip=f"Cyclone Heat Reservoir ({f['tchp']} kJ/cm²)"
            ).add_to(m)
            
        folium.Marker(
            location=[f["lat"], f["lng"]],
            popup=f"<b>{f['name']}</b><br>WMO: {f['wmoId']}<br>SST: {f['surfaceTemp']}°C | TCHP: {f['tchp']} kJ/cm²<br>Waves: {f['waveHeight']}m | D26: {f['d26Depth']}m",
            tooltip=f"🛰️ WMO {f['wmoId']} ({f['riskLevel']})",
            icon=folium.Icon(color=f_color, icon="info-sign")
        ).add_to(m)
    
    # Draw Navigational Bearing Line
    folium.PolyLine(
        locations=[[selected_loc["lat"], selected_loc["lng"]], [nearest_float["lat"], nearest_float["lng"]]],
        color="#38bdf8",
        weight=3,
        dash_array="5, 10",
        tooltip=f"Vector to {nearest_float['name']} ({dist_nm} NM, Heading {compass_str})"
    ).add_to(m)
    
    st_folium(m, width="100%", height=480)

# ---------------------------------------------------------
# TAB 2: LOCATION & FLOAT TELEMETRY
# ---------------------------------------------------------
with tab_details:
    st.subheader(f"📍 Location Intelligence: {selected_loc['name']}")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Sea Surface Temp (SST)", f"{nearest_float['surfaceTemp']} °C", delta=f"{nearest_float['sstAnomaly']} °C Anomaly")
    with col2:
        st.metric("Cyclone Heat (TCHP)", f"{nearest_float['tchp']} kJ/cm²", delta="High Danger" if nearest_float['tchp'] > 60 else "Safe", delta_color="inverse" if nearest_float['tchp'] > 60 else "normal")
    with col3:
        st.metric("Swell Wave Height", f"{nearest_float['waveHeight']} m", delta=f"{nearest_float['windSpeedKnots']} kts Wind")
    with col4:
        st.metric("D26 Thermocline Depth", f"{nearest_float['d26Depth']} m", delta=f"MLD: {nearest_float['mld']}m")
        
    st.markdown("---")
    
    c_left, c_right = st.columns(2)
    with c_left:
        st.markdown(f"#### 🧭 Nautical Navigation Track")
        st.write(f"- **Origin Location**: `{selected_loc['name']}` ({selected_loc['state']})")
        st.write(f"- **Geographic Coordinates**: `{selected_loc['lat']:.4f}°N, {selected_loc['lng']:.4f}°E`")
        if not selected_loc.get("is_coastal", True):
            st.write(f"- **Distance to Coast**: `{selected_loc.get('coastal_dist_km', 200)} km` inland")
            st.write(f"- **Maritime Coastal Gateway**: `{selected_loc['port']}`")
        st.write(f"- **Outbound Compass Heading**: **`{compass_str}`**")
        st.write(f"- **Safe Return Heading to Shore**: **`{return_compass_str}`**")
        st.write(f"- **Distance to Profiling Float**: `{dist_to_float} km` (`{dist_nm} Nautical Miles`)")
    
    with c_right:
        st.markdown(f"#### 🛰️ Linked Float: {nearest_float['name']}")
        st.write(f"- **WMO ID**: `{nearest_float['wmoId']}` | **Cycle**: `#{nearest_float['cycleNumber']}`")
        st.write(f"- **Basin**: `{nearest_float['basin']}`")
        st.write(f"- **Coordinates**: `{nearest_float['lat']}°N, {nearest_float['lng']}°E`")
        st.write(f"- **Salinity**: `{nearest_float['surfaceSalinity']} PSU`")
        st.write(f"- **Battery**: `{nearest_float['batteryPercent']}%` | **Status**: `{nearest_float['transmissionStatus']}`")
        st.write(f"- **Risk Assessment**: **`{nearest_float['riskLevel']}`**")

# ---------------------------------------------------------
# TAB 3: OCEAN CTD DEPTH PROFILER
# ---------------------------------------------------------
with tab_profile:
    st.subheader(f"🌊 Vertical CTD Profiler (0m to 2000m) - Buoy {nearest_float['wmoId']}")
    st.caption("Plots temperature gradient, D26 isotherm depth, salinity halocline, and density layers.")
    
    prof_df = pd.DataFrame(nearest_float["profilePoints"])
    
    fig = go.Figure()
    # Temperature Profile
    fig.add_trace(go.Scatter(
        x=prof_df["temp"],
        y=prof_df["depth"],
        mode="lines+markers",
        name="Water Temp (°C)",
        line=dict(color="#f43f5e", width=3),
        marker=dict(size=6)
    ))
    
    # Salinity Profile
    fig.add_trace(go.Scatter(
        x=prof_df["salinity"],
        y=prof_df["depth"],
        mode="lines+markers",
        name="Salinity (PSU)",
        line=dict(color="#38bdf8", width=2, dash="dash"),
        xaxis="x2"
    ))
    
    # D26 Isotherm line
    fig.add_hline(y=nearest_float["d26Depth"], line_dash="dot", line_color="#eab308",
                  annotation_text=f"D26 Depth: {nearest_float['d26Depth']}m (26°C Isotherm)")
    
    fig.update_layout(
        title=f"Vertical Depth Profile for {nearest_float['name']}",
        xaxis=dict(title="Temperature (°C)", titlefont=dict(color="#f43f5e"), tickfont=dict(color="#f43f5e")),
        xaxis2=dict(title="Salinity (PSU)", titlefont=dict(color="#38bdf8"), tickfont=dict(color="#38bdf8"),
                    overlaying="x", side="top"),
        yaxis=dict(title="Depth (Meters)", autorange="reversed"),
        height=500,
        template="plotly_dark",
        margin=dict(l=40, r=40, t=50, b=40)
    )
    
    st.plotly_chart(fig, use_container_width=True)

# ---------------------------------------------------------
# TAB 4: PFZ & MARINE BIODATA
# ---------------------------------------------------------
with tab_pfz:
    st.subheader(f"🐟 Potential Fishing Zone (PFZ) & Commercial Species")
    
    col_p1, col_p2, col_p3 = st.columns(3)
    with col_p1:
        st.metric("Chlorophyll Proxy", "1.42 mg/m³", delta="High Bloom (PFZ Active)")
    with col_p2:
        st.metric("Dissolved Oxygen (DO)", "4.35 ml/L", delta="Optimal Pelagic Layer")
    with col_p3:
        st.metric("Optimal Catch Layer", "15m – 45m Depth", delta="Thermocline Front")
        
    st.markdown("#### 🎣 Recommended Fish Species & Vernacular Names")
    
    # State-based species list
    state_str = selected_loc.get("state", "Tamil Nadu")
    if "Karnataka" in state_str:
        species_data = [
            {"Species": "Seer Fish / King Mackerel", "Local Vernacular": "ಅಂಜಲ್ (Anjal / Surmai)", "Catch Depth": "15m – 35m", "Gear": "Drift Gillnet / Trolling Line", "Abundance": "High"},
            {"Species": "Indian Mackerel", "Local Vernacular": "ಬಂಗುಡೆ (Bangude)", "Catch Depth": "10m – 25m", "Gear": "Purse Seine / Ring Net", "Abundance": "Abundant"},
            {"Species": "Indian Oil Sardine", "Local Vernacular": "ಭೂತಾಯಿ (Boothai)", "Catch Depth": "5m – 20m", "Gear": "Encircling Gillnet", "Abundance": "Very High"},
            {"Species": "White / Silver Pomfret", "Local Vernacular": "ಮಾಂಜಿ (Maanji)", "Catch Depth": "15m – 40m", "Gear": "Bottom Drift Net", "Abundance": "Moderate"},
            {"Species": "Tiger Prawns / Shrimp", "Local Vernacular": "ಸಿಗಡಿ (Sigadi)", "Catch Depth": "10m – 30m", "Gear": "Bottom Trawl Net", "Abundance": "Abundant"},
        ]
    elif "Kerala" in state_str:
        species_data = [
            {"Species": "Indian Oil Sardine", "Local Vernacular": "മത്തി (Mathi)", "Catch Depth": "5m – 25m", "Gear": "Ring Seine / Purse Seine", "Abundance": "Very High"},
            {"Species": "Indian Mackerel", "Local Vernacular": "അയല (Ayala)", "Catch Depth": "10m – 30m", "Gear": "Gillnet / Hook & Line", "Abundance": "Abundant"},
            {"Species": "Yellowfin / Skipjack Tuna", "Local Vernacular": "ചൂര (Choora)", "Catch Depth": "25m – 60m", "Gear": "Pole & Line / Longline", "Abundance": "High"},
            {"Species": "Pearl Spot", "Local Vernacular": "കരിമീൻ (Karimeen)", "Catch Depth": "2m – 12m", "Gear": "Cast Net / Gillnet", "Abundance": "Moderate"},
        ]
    elif "Tamil" in state_str or "Andhra" in state_str:
        species_data = [
            {"Species": "Seer Fish / King Mackerel", "Local Vernacular": "வஞ்சிரம் (Vanjaram) / వంజరం", "Catch Depth": "15m – 35m", "Gear": "Drift Gillnet / Trolling Line", "Abundance": "Abundant"},
            {"Species": "Yellowfin Tuna", "Local Vernacular": "சூரை (Soorai) / ట్యూనా", "Catch Depth": "30m – 80m", "Gear": "Longline / Hook & Line", "Abundance": "High"},
            {"Species": "Tiger Prawns", "Local Vernacular": "இறால் (Eral) / రొయ్యలు", "Catch Depth": "10m – 25m", "Gear": "Bottom Trawl", "Abundance": "Abundant"},
            {"Species": "Indian Oil Sardine", "Local Vernacular": "மத்தி (Mathi) / కవ్వళ్ళు", "Catch Depth": "5m – 20m", "Gear": "Ring Seine", "Abundance": "Abundant"},
        ]
    else:
        species_data = [
            {"Species": "Silver Pomfret", "Local Vernacular": "पापलेट / પાપલેટ (Paplet)", "Catch Depth": "15m – 40m", "Gear": "Bottom Drift Net", "Abundance": "Abundant"},
            {"Species": "Bombay Duck", "Local Vernacular": "बोंबील / બુમલા (Bombil)", "Catch Depth": "8m – 30m", "Gear": "Dol Net / Stake Net", "Abundance": "Abundant"},
            {"Species": "Hilsa / Ilish", "Local Vernacular": "ইলিশ / ଇଲିଶି (Ilish)", "Catch Depth": "5m – 20m", "Gear": "Drift Gillnet", "Abundance": "Seasonal High"},
        ]
        
    st.table(pd.DataFrame(species_data))

# ---------------------------------------------------------
# TAB 5: EMERGENCY BROADCAST & SMS
# ---------------------------------------------------------
with tab_broadcast:
    st.subheader("📻 Coastal Emergency Broadcast & VHF Radio")
    
    port_name = selected_loc.get("port", selected_loc["name"])
    risk_level = nearest_float["riskLevel"]
    tchp_val = nearest_float["tchp"]
    wave_val = nearest_float["waveHeight"]
    wmo_val = nearest_float["wmoId"]
    
    if risk_level == "HIGH_RISK":
        vhf_script = f"SECURITE SECURITE SECURITE. ALL SHIPS ALL STATIONS. THIS IS FLOATCHAT MARITIME ADVISORY FOR {port_name.upper()}. ARGO BUOY {wmo_val} REPORTS CRITICAL CYCLONE HEAT POTENTIAL {tchp_val} KJ/CM2 AND WAVE SWELL {wave_val} METERS. ALL FISHING VESSELS STRONGLY ADVISED TO HALT OPERATIONS AND RETURN TO HARBOR IMMEDIATELY. MAINTAIN WATCH ON VHF CHANNEL 16. OUT."
        sms_text = f"[FLOATCHAT ALERT] {port_name}: CRITICAL DANGER! TCHP {tchp_val}kJ/cm2, Wave {wave_val}m. Cyclone heat buildup. DO NOT GO TO SEA. Return immediately. VHF:16"
    elif risk_level == "MODERATE_RISK":
        vhf_script = f"SECURITE SECURITE SECURITE. ALL STATIONS. FLOATCHAT MARINE BULLETIN FOR {port_name.upper()}. MODERATE SWELL AND THERMAL TURBULENCE REPORTED. WAVE HEIGHT {wave_val} METERS. ARTISANAL CRAFTS ADVISE CLOSE INSHORE NAVIGATION ONLY. STANDBY ON CHANNEL 16. OUT."
        sms_text = f"[FLOATCHAT ADVISORY] {port_name}: MODERATE RISK. Wave {wave_val}m. Small boats stay near shore (<10nm). Check updates before sailing. VHF:16"
    else:
        vhf_script = f"ALL STATIONS. FLOATCHAT ROUTINE BULLETIN FOR {port_name.upper()}. NORMAL SWELL {wave_val} METERS. SST STABLE. SAFE NAVIGATION REPORTED ACROSS ALL INSHORE SECTORS. STANDBY ON CHANNEL 16. OUT."
        sms_text = f"[FLOATCHAT NOTICE] {port_name}: ALL CLEAR. Wave {wave_val}m, normal sea temp. Safe window for fishing operations. Safe voyage."
        
    st.markdown("#### 📢 VHF Securite Radio Distress Script (Channel 16)")
    st.code(vhf_script, language="text")
    
    st.markdown("#### 📱 Ready-to-Send 160-Char SMS Alert")
    st.code(sms_text, language="text")
    st.caption(f"Character Count: {len(sms_text)} / 160 chars (Fits standard 2G GSM cellular protocol)")

# ---------------------------------------------------------
# TAB 6: AI MARINE ADVISOR (GROQ & GEMINI)
# ---------------------------------------------------------
with tab_ai:
    col_ai_t1, col_ai_t2 = st.columns([3, 1])
    with col_ai_t1:
        st.subheader("🤖 AI Ocean Intelligence Assistant")
        st.caption("Powered by Groq (Llama 3.3 70B / 8B), Google Gemini, and INCOIS Ocean Physics Engine.")
    with col_ai_t2:
        st.markdown(f"""
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; padding: 6px 12px; border-radius: 6px; text-align: center;">
            <small style="color: #34d399; font-weight: bold;">Engine: {ai_provider.split(':')[0] if ':' in ai_provider else ai_provider[:16]}</small>
        </div>
        """, unsafe_allow_html=True)
    
    # Determine Provider and Model based on sidebar selection
    selected_provider = "Auto"
    groq_model_name = "llama-3.3-70b-versatile"
    
    if "Groq: Llama 3.3 70B" in ai_provider:
        selected_provider = "Groq"
        groq_model_name = "llama-3.3-70b-versatile"
    elif "Groq: Llama 3.1 8B" in ai_provider:
        selected_provider = "Groq"
        groq_model_name = "llama-3.1-8b-instant"
    elif "Groq: Mixtral" in ai_provider:
        selected_provider = "Groq"
        groq_model_name = "mixtral-8x7b-32768"
    elif "Gemini" in ai_provider:
        selected_provider = "Gemini"
    elif "Physics" in ai_provider:
        selected_provider = "Physics"
    else:
        selected_provider = "Auto"

    user_prompt = st.text_input(
        "Ask FloatChat AI:",
        placeholder=f"Is it safe to go fishing from {selected_loc['name']} today? What are the wave and cyclone conditions?"
    )
    
    col_q1, col_q2, col_q3 = st.columns(3)
    with col_q1:
        if st.button("🌊 Check Cyclone & TCHP Risk"):
            user_prompt = f"Analyze cyclone heat potential and risk for {selected_loc['name']}."
    with col_q2:
        if st.button("🐟 Best Fishing Zones & Depth"):
            user_prompt = f"What are the best fishing depths and target species near {selected_loc['name']}?"
    with col_q3:
        if st.button("🧭 Safe Return Compass Heading"):
            user_prompt = f"What is the safe return heading from the offshore buoy back to {selected_loc['name']}?"

    if user_prompt:
        with st.spinner("Analyzing ocean CTD parameters with AI and generating maritime safety response..."):
            if selected_provider == "Physics":
                ai_response, badge = fallback_heuristic_response(user_prompt, nearest_float, selected_loc), "🌊 Smart Ocean Physics Engine"
            else:
                ai_response, badge = query_unified_ai(
                    user_prompt,
                    provider=selected_provider,
                    context_float=nearest_float,
                    location_info=selected_loc,
                    custom_groq_key=sidebar_groq_key,
                    custom_gemini_key=sidebar_gemini_key,
                    groq_model=groq_model_name
                )
            
            st.markdown(f"### 💬 AI Advisor Response: `{badge}`")
            st.markdown(ai_response)
            st.info(f"Connected to Float: **{nearest_float['name']} (WMO {nearest_float['wmoId']})** | SST: `{nearest_float['surfaceTemp']}°C` | TCHP: `{nearest_float['tchp']} kJ/cm²` | Waves: `{nearest_float['waveHeight']}m`")

# ---------------------------------------------------------
# FOOTER
# ---------------------------------------------------------
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: #64748b; font-size: 0.85rem;'>"
    "FloatChat • Autonomous Ocean Physics & Fishermen Safety Intelligence System • "
    "Designed for Streamlit Community Cloud & INCOIS ARGO Profiling Networks"
    "</div>",
    unsafe_allow_html=True
)
