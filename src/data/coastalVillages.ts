import { ArgoFloat, CoastalState, CoastalVillage, UserProfile, VillageConditionResult } from '../types';
import { calculateDistanceKm, generateLocationTrack, generateMarineBiodata } from '../utils/oceanPhysics';

export const COASTAL_STATES: CoastalState[] = [
  {
    name: 'Tamil Nadu',
    nativeName: 'தமிழ்நாடு',
    basin: 'Bay of Bengal',
    primaryLanguage: 'ta',
    districts: ['Chennai', 'Kanchipuram', 'Chengalpattu', 'Villupuram', 'Cuddalore', 'Nagapattinam', 'Mayiladuthurai', 'Tiruvarur', 'Thanjavur', 'Pudukkottai', 'Ramanathapuram', 'Thoothukudi', 'Tirunelveli', 'Kanyakumari', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Vellore', 'Tiruppur', 'Dindigul', 'Theni']
  },
  {
    name: 'Kerala',
    nativeName: 'കേരളം',
    basin: 'Arabian Sea',
    primaryLanguage: 'ml',
    districts: ['Thiruvananthapuram', 'Kollam', 'Alappuzha', 'Ernakulam', 'Thrissur', 'Malappuram', 'Kozhikode', 'Kannur', 'Kasaragod', 'Palakkad', 'Kottayam', 'Idukki', 'Pathanamthitta', 'Wayanad']
  },
  {
    name: 'Andhra Pradesh',
    nativeName: 'ఆంధ్ర ప్రదేశ్',
    basin: 'Bay of Bengal',
    primaryLanguage: 'te',
    districts: ['Srikakulam', 'Vizianagaram', 'Visakhapatnam', 'Anakapalli', 'Kakinada', 'Dr. B.R. Ambedkar Konaseema', 'West Godavari', 'Krishna', 'Bapatla', 'Prakasam', 'Sri Potti Sriramulu Nellore', 'Tirupati', 'Guntur', 'NTR', 'Vijayawada', 'Kurnool', 'Ananthapuramu', 'Kadapa', 'Chittoor']
  },
  {
    name: 'Odisha',
    nativeName: 'ଓଡ଼ିଶା',
    basin: 'Bay of Bengal',
    primaryLanguage: 'or',
    districts: ['Balasore', 'Bhadrak', 'Kendrapara', 'Jagatsinghpur', 'Puri', 'Ganjam', 'Khordha', 'Bhubaneswar', 'Cuttack', 'Sambalpur', 'Rourkela']
  },
  {
    name: 'West Bengal',
    nativeName: 'পশ্চিমবঙ্গ',
    basin: 'Bay of Bengal',
    primaryLanguage: 'bn',
    districts: ['Purba Medinipur', 'South 24 Parganas', 'North 24 Parganas', 'Howrah', 'Kolkata', 'Hooghly', 'Nadia', 'Murshidabad', 'Siliguri']
  },
  {
    name: 'Maharashtra',
    nativeName: 'महाराष्ट्र',
    basin: 'Arabian Sea',
    primaryLanguage: 'mr',
    districts: ['Palghar', 'Thane', 'Mumbai City', 'Mumbai Suburban', 'Raigad', 'Ratnagiri', 'Sindhudurg', 'Pune', 'Nashik', 'Nagpur', 'Kolhapur', 'Chhatrapati Sambhajinagar', 'Solapur', 'Satara', 'Sangli']
  },
  {
    name: 'Gujarat',
    nativeName: 'ગુજરાત',
    basin: 'Arabian Sea',
    primaryLanguage: 'gu',
    districts: ['Kutch', 'Morbi', 'Jamnagar', 'Devbhumi Dwarka', 'Porbandar', 'Junagadh', 'Gir Somnath', 'Amreli', 'Bhavnagar', 'Ahmedabad', 'Anand', 'Bharuch', 'Surat', 'Navsari', 'Valsad', 'Vadodara', 'Rajkot', 'Gandhinagar']
  },
  {
    name: 'Karnataka',
    nativeName: 'ಕರ್ನಾಟಕ',
    basin: 'Arabian Sea',
    primaryLanguage: 'kn',
    districts: [
      'Tumakuru', 'Tumkur', 'Dakshina Kannada', 'Mangalore', 'Udupi', 'Malpe', 'Uttara Kannada', 'Karwar', 'Bhatkal', 'Honnavar', 'Kundapura',
      'Bengaluru Urban', 'Bengaluru Rural', 'Bangalore', 'Mysuru', 'Mysore', 'Shivamogga', 'Shimoga', 'Hassan', 'Chikkamagaluru',
      'Hubballi', 'Dharwad', 'Belagavi', 'Belgaum', 'Davanagere', 'Bellary', 'Ballari', 'Kalaburagi', 'Gulbarga', 'Raichur', 'Bidar',
      'Kolar', 'Mandya', 'Chitradurga', 'Koppal', 'Gadag', 'Haveri', 'Bagalkot', 'Vijayapura', 'Bijapur', 'Yadgir', 'Chamarajanagar', 'Ramanagara', 'Kodagu'
    ]
  },
  {
    name: 'Goa',
    nativeName: 'गोंय',
    basin: 'Arabian Sea',
    primaryLanguage: 'mr',
    districts: ['North Goa', 'South Goa', 'Panaji', 'Vasco da Gama', 'Margao']
  },
  {
    name: 'Puducherry',
    nativeName: 'புதுச்சேரி',
    basin: 'Bay of Bengal',
    primaryLanguage: 'ta',
    districts: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe']
  },
  {
    name: 'Andaman & Nicobar',
    nativeName: 'अंडमान और निकोबार',
    basin: 'Bay of Bengal',
    primaryLanguage: 'hi',
    districts: ['South Andaman', 'North and Middle Andaman', 'Nicobar', 'Port Blair']
  },
  {
    name: 'Lakshadweep',
    nativeName: 'ലക്ഷദ്വീപ്',
    basin: 'Arabian Sea',
    primaryLanguage: 'ml',
    districts: ['Kavaratti', 'Agatti', 'Minicoy', 'Andrott', 'Amini', 'Kalpeni']
  }
];

export const COASTAL_VILLAGES: CoastalVillage[] = [
  // Tamil Nadu
  {
    id: 'vil-kasimedu',
    name: 'Kasimedu (Royapuram)',
    nativeName: 'காசிமேடு',
    district: 'Chennai',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 13.1250,
    lng: 80.2980,
    nearestPortId: 'port-chennai-kasimedu',
    nearestPortName: 'Chennai Kasimedu Harbor',
    primaryFishCatch: ['Seer fish (Vanjaram)', 'Tuna', 'Tiger Prawns', 'Sardines'],
    localCoastGuardHelpline: '+91-44-25951234 / CG 1554',
    fleetSize: 1200
  },
  {
    id: 'vil-kovalam-tn',
    name: 'Kovalam (Covelong)',
    nativeName: 'கோவளம்',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 12.7890,
    lng: 80.2520,
    nearestPortId: 'port-chennai-kasimedu',
    nearestPortName: 'Chennai Kasimedu Harbor',
    primaryFishCatch: ['Mackerel', 'Crab', 'Anchovy', 'Snapper'],
    localCoastGuardHelpline: '+91-44-27472233 / 1554',
    fleetSize: 340
  },
  {
    id: 'vil-cuddalore-ot',
    name: 'Cuddalore Old Town (Devanampattinam)',
    nativeName: 'தேவனாம்பட்டினம்',
    district: 'Cuddalore',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 11.7480,
    lng: 79.7710,
    nearestPortId: 'port-chennai-kasimedu',
    nearestPortName: 'Cuddalore Minor Harbor',
    primaryFishCatch: ['Prawns', 'Ribbon fish', 'Squid', 'Croaker'],
    localCoastGuardHelpline: '+91-4142-238100 / 1554',
    fleetSize: 520
  },
  {
    id: 'vil-nagapattinam',
    name: 'Nagapattinam Port Village (Nagoor / Akkaraipettai)',
    nativeName: 'அக்கரைப்பேட்டை',
    district: 'Nagapattinam',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 10.7650,
    lng: 79.8420,
    nearestPortId: 'port-chennai-kasimedu',
    nearestPortName: 'Nagapattinam Port',
    primaryFishCatch: ['Hilsa', 'Tuna', 'White Prawn', 'Seer Fish'],
    localCoastGuardHelpline: '+91-4365-242222 / 1554',
    fleetSize: 850
  },
  {
    id: 'vil-rameswaram',
    name: 'Rameswaram (Pamban / Dhanushkodi)',
    nativeName: 'ராமேஸ்வரம் / தனுஷ்கோடி',
    district: 'Ramanathapuram',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 9.2876,
    lng: 79.3129,
    nearestPortId: 'port-chennai-kasimedu',
    nearestPortName: 'Pamban / Mandapam Base',
    primaryFishCatch: ['Blue Swimmer Crab', 'Squid', 'Cuttlefish', 'Ray'],
    localCoastGuardHelpline: '+91-4573-221245 / 1554',
    fleetSize: 1400
  },
  {
    id: 'vil-kanyakumari-muttom',
    name: 'Muttom / Colachel',
    nativeName: 'முட்டம் / குளச்சல்',
    district: 'Kanyakumari',
    state: 'Tamil Nadu',
    basin: 'Indian Ocean',
    lat: 8.1250,
    lng: 77.3170,
    nearestPortId: 'port-vizhinjam',
    nearestPortName: 'Colachel Harbor',
    primaryFishCatch: ['Yellowfin Tuna', 'Skipjack', 'Shark', 'Mahi Mahi'],
    localCoastGuardHelpline: '+91-4652-260100 / 1554',
    fleetSize: 780
  },

  // Kerala
  {
    id: 'vil-vizhinjam',
    name: 'Vizhinjam Marine Village',
    nativeName: 'വിഴിഞ്ഞം',
    district: 'Thiruvananthapuram',
    state: 'Kerala',
    basin: 'Arabian Sea',
    lat: 8.3780,
    lng: 76.9940,
    nearestPortId: 'port-vizhinjam',
    nearestPortName: 'Vizhinjam International Port',
    primaryFishCatch: ['Tuna', 'Sardine', 'Mackerel', 'Anchovy (Netholi)'],
    localCoastGuardHelpline: '+91-471-2480333 / 1554',
    fleetSize: 950
  },
  {
    id: 'vil-neendakara',
    name: 'Neendakara / Sakthikulangara',
    nativeName: 'നീണ്ടകര / ശക്തികുളങ്ങര',
    district: 'Kollam',
    state: 'Kerala',
    basin: 'Arabian Sea',
    lat: 8.9390,
    lng: 76.5410,
    nearestPortId: 'port-cochin',
    nearestPortName: 'Neendakara Harbor',
    primaryFishCatch: ['Karikkadi Prawns', 'Calamari Squid', 'Threadfin Bream (Kilimeen)'],
    localCoastGuardHelpline: '+91-474-2794500 / 1554',
    fleetSize: 1100
  },
  {
    id: 'vil-cochin-munambam',
    name: 'Munambam / Thoppumpady',
    nativeName: 'മുനമ്പം / തോപ്പുംപടി',
    district: 'Ernakulam',
    state: 'Kerala',
    basin: 'Arabian Sea',
    lat: 10.1830,
    lng: 76.1670,
    nearestPortId: 'port-cochin',
    nearestPortName: 'Cochin Fishing Harbor',
    primaryFishCatch: ['Deep-sea Prawns', 'Tuna', 'Reef Cod', 'Snapper'],
    localCoastGuardHelpline: '+91-484-2216255 / 1554',
    fleetSize: 1300
  },
  {
    id: 'vil-beypore',
    name: 'Beypore (Kozhikode)',
    nativeName: 'ബേപ്പൂർ',
    district: 'Kozhikode',
    state: 'Kerala',
    basin: 'Arabian Sea',
    lat: 11.1620,
    lng: 75.8080,
    nearestPortId: 'port-cochin',
    nearestPortName: 'Beypore Port',
    primaryFishCatch: ['Mackerel (Ayala)', 'Sardine (Mathi)', 'Kingfish (Ayakoora)'],
    localCoastGuardHelpline: '+91-495-2414000 / 1554',
    fleetSize: 620
  },

  // Andhra Pradesh
  {
    id: 'vil-vizag-jalaripeta',
    name: 'Jalaripeta / Bheemili',
    nativeName: 'జలారిపేట / భీమిలి',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    basin: 'Bay of Bengal',
    lat: 17.7200,
    lng: 83.3350,
    nearestPortId: 'port-visakhapatnam',
    nearestPortName: 'Visakhapatnam Harbor',
    primaryFishCatch: ['Tiger Prawns', 'White Pomfret', 'Tuna', 'Ribbon Fish'],
    localCoastGuardHelpline: '+91-891-2563721 / 1554',
    fleetSize: 850
  },
  {
    id: 'vil-kakinada-hope',
    name: 'Kakinada (Kumbhabhishekam / Hope Island)',
    nativeName: 'కాకినాడ / కుంభాభిషేకం',
    district: 'Kakinada',
    state: 'Andhra Pradesh',
    basin: 'Bay of Bengal',
    lat: 16.9600,
    lng: 82.2600,
    nearestPortId: 'port-visakhapatnam',
    nearestPortName: 'Kakinada Deep Water Harbor',
    primaryFishCatch: ['Mud Crabs', 'Vannamei Shrimp', 'Catfish', 'Seer Fish'],
    localCoastGuardHelpline: '+91-884-2361111 / 1554',
    fleetSize: 920
  },
  {
    id: 'vil-machilipatnam',
    name: 'Machilipatnam (Gilakaladindi)',
    nativeName: 'మచిలీపట్నం / గిలకలదిండి',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    basin: 'Bay of Bengal',
    lat: 16.1800,
    lng: 81.1600,
    nearestPortId: 'port-visakhapatnam',
    nearestPortName: 'Machilipatnam Port',
    primaryFishCatch: ['Scampi', 'Croaker', 'Mullet', 'Pomfret'],
    localCoastGuardHelpline: '+91-8672-222345 / 1554',
    fleetSize: 450
  },
  {
    id: 'vil-bhavanapadu',
    name: 'Bhavanapadu / Kalingapatnam',
    nativeName: 'భావనపాడు / కళింగపట్నం',
    district: 'Srikakulam',
    state: 'Andhra Pradesh',
    basin: 'Bay of Bengal',
    lat: 18.5700,
    lng: 84.3500,
    nearestPortId: 'port-visakhapatnam',
    nearestPortName: 'Bhavanapadu Harbor',
    primaryFishCatch: ['Sardines', 'Anchovies', 'Silver Pomfret'],
    localCoastGuardHelpline: '+91-8942-278200 / 1554',
    fleetSize: 380
  },

  // Odisha
  {
    id: 'vil-paradip',
    name: 'Paradip (Nehru Bungla / Sandhakuda)',
    nativeName: 'ପାରାଦ୍ୱୀପ',
    district: 'Jagatsinghpur',
    state: 'Odisha',
    basin: 'Bay of Bengal',
    lat: 20.3160,
    lng: 86.6110,
    nearestPortId: 'port-paradip',
    nearestPortName: 'Paradip Fishing Harbor',
    primaryFishCatch: ['Hilsa (Ilish)', 'Black Pomfret', 'Sea Crab', 'Prawns'],
    localCoastGuardHelpline: '+91-6722-222045 / 1554',
    fleetSize: 1150
  },
  {
    id: 'vil-chandipur',
    name: 'Chandipur / Balaramgadi',
    nativeName: 'ଚାନ୍ଦିପୁର / ବଳରାମଗଡ଼ି',
    district: 'Balasore',
    state: 'Odisha',
    basin: 'Bay of Bengal',
    lat: 21.4700,
    lng: 87.0200,
    nearestPortId: 'port-paradip',
    nearestPortName: 'Dhamra Port Base',
    primaryFishCatch: ['Hilsa', 'Bhetki (Barramundi)', 'Horseshoe Crabs', 'Ribbon Fish'],
    localCoastGuardHelpline: '+91-6782-272210 / 1554',
    fleetSize: 640
  },
  {
    id: 'vil-puri-pentakota',
    name: 'Puri (Pentakota / Arakhakuda)',
    nativeName: 'ପୁରୀ ପେଣ୍ଠକଟା',
    district: 'Puri',
    state: 'Odisha',
    basin: 'Bay of Bengal',
    lat: 19.8000,
    lng: 85.8400,
    nearestPortId: 'port-paradip',
    nearestPortName: 'Puri Fishery Jetty',
    primaryFishCatch: ['Catla', 'Mackerel', 'Tiger Shrimp', 'Puffer Fish'],
    localCoastGuardHelpline: '+91-6752-223400 / 1554',
    fleetSize: 420
  },

  // West Bengal
  {
    id: 'vil-digha',
    name: 'Digha (Mohana Fishing Landing Center)',
    nativeName: 'দিঘা মোহনা',
    district: 'Purba Medinipur',
    state: 'West Bengal',
    basin: 'Bay of Bengal',
    lat: 21.6280,
    lng: 87.5250,
    nearestPortId: 'port-paradip',
    nearestPortName: 'Digha Mohana Fishery Dock',
    primaryFishCatch: ['Padma Hilsa', 'Bhetki', 'Topse', 'Pomfret', 'Tiger Prawn'],
    localCoastGuardHelpline: '+91-3220-266100 / 1554',
    fleetSize: 1400
  },
  {
    id: 'vil-shankarpur',
    name: 'Shankarpur / Petuaghat',
    nativeName: 'শংকরপুর / পেটুয়াঘাট',
    district: 'Purba Medinipur',
    state: 'West Bengal',
    basin: 'Bay of Bengal',
    lat: 21.6400,
    lng: 87.5700,
    nearestPortId: 'port-paradip',
    nearestPortName: 'Petuaghat Harbor',
    primaryFishCatch: ['Hilsa', 'Chital', 'Lobster', 'Bombay Duck'],
    localCoastGuardHelpline: '+91-3220-278300 / 1554',
    fleetSize: 890
  },
  {
    id: 'vil-kakdwip',
    name: 'Kakdwip / Namkhana / Fraserganj',
    nativeName: 'কাকদ্বীপ / ফ্রেজারগঞ্জ',
    district: 'South 24 Parganas',
    state: 'West Bengal',
    basin: 'Bay of Bengal',
    lat: 21.8700,
    lng: 88.1800,
    nearestPortId: 'port-paradip',
    nearestPortName: 'Fraserganj Fishing Port',
    primaryFishCatch: ['Sundarbans Hilsa', 'Parshe', 'Bhangan', 'Bagda Chingri'],
    localCoastGuardHelpline: '+91-3210-255010 / 1554',
    fleetSize: 980
  },

  // Maharashtra
  {
    id: 'vil-versova',
    name: 'Versova Koliwada (Mumbai)',
    nativeName: 'वर्सोवा कोळीवाडा',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    basin: 'Arabian Sea',
    lat: 19.1350,
    lng: 72.8120,
    nearestPortId: 'port-mumbai-sassoon',
    nearestPortName: 'Versova Fishing Dock',
    primaryFishCatch: ['Bombay Duck (Bombil)', 'Pomfret (Paplet)', 'Surmai', 'Kolambi (Prawns)'],
    localCoastGuardHelpline: '+91-22-24371932 / 1554',
    fleetSize: 670
  },
  {
    id: 'vil-sassoon',
    name: 'Sassoon Dock (Colaba)',
    nativeName: 'ससून डॉक',
    district: 'Mumbai City',
    state: 'Maharashtra',
    basin: 'Arabian Sea',
    lat: 18.9180,
    lng: 72.8270,
    nearestPortId: 'port-mumbai-sassoon',
    nearestPortName: 'Sassoon Dock Harbor',
    primaryFishCatch: ['Surmai', 'Halwa (Black Pomfret)', 'Ghol', 'Squid', 'Lobster'],
    localCoastGuardHelpline: '+91-22-22661554 / 1554',
    fleetSize: 1250
  },
  {
    id: 'vil-ratnagiri-mirkarwada',
    name: 'Mirkarwada (Ratnagiri)',
    nativeName: 'मिरकरवाडा (रत्नागिरी)',
    district: 'Ratnagiri',
    state: 'Maharashtra',
    basin: 'Arabian Sea',
    lat: 16.9900,
    lng: 73.2800,
    nearestPortId: 'port-mumbai-sassoon',
    nearestPortName: 'Mirkarwada Fishing Harbor',
    primaryFishCatch: ['King Mackerel (Surmai)', 'Bangda', 'Tarli (Sardines)', 'Jawla'],
    localCoastGuardHelpline: '+91-2352-222400 / 1554',
    fleetSize: 740
  },
  {
    id: 'vil-malvan',
    name: 'Malvan / Tarkarli',
    nativeName: 'मालवण / तारकर्ली',
    district: 'Sindhudurg',
    state: 'Maharashtra',
    basin: 'Arabian Sea',
    lat: 16.0600,
    lng: 73.4600,
    nearestPortId: 'port-mumbai-sassoon',
    nearestPortName: 'Malvan Jetty Base',
    primaryFishCatch: ['Mori (Shark)', 'Rawas (Indian Salmon)', 'Squid', 'Crabs'],
    localCoastGuardHelpline: '+91-2365-252100 / 1554',
    fleetSize: 380
  },

  // Gujarat
  {
    id: 'vil-veraval',
    name: 'Veraval Fishing Harbor',
    nativeName: 'વેરાવળ હાર્બર',
    district: 'Gir Somnath',
    state: 'Gujarat',
    basin: 'Arabian Sea',
    lat: 20.9000,
    lng: 70.3600,
    nearestPortId: 'port-veraval',
    nearestPortName: 'Veraval Mega Harbor',
    primaryFishCatch: ['Ribbon Fish', 'Croaker', 'Cuttlefish', 'Silver Pomfret', 'Squid'],
    localCoastGuardHelpline: '+91-2876-242255 / 1554',
    fleetSize: 3400
  },
  {
    id: 'vil-porbandar',
    name: 'Porbandar Subhash Nagar',
    nativeName: 'પોરબંદર',
    district: 'Porbandar',
    state: 'Gujarat',
    basin: 'Arabian Sea',
    lat: 21.6400,
    lng: 69.6000,
    nearestPortId: 'port-veraval',
    nearestPortName: 'Porbandar Port',
    primaryFishCatch: ['Tuna', 'Seer Fish', 'Hilsa', 'Catfish', 'Prawns'],
    localCoastGuardHelpline: '+91-286-2244111 / 1554',
    fleetSize: 1800
  },
  {
    id: 'vil-mangrol',
    name: 'Mangrol Fishery Port',
    nativeName: 'માંગરોળ',
    district: 'Junagadh',
    state: 'Gujarat',
    basin: 'Arabian Sea',
    lat: 21.1200,
    lng: 70.1100,
    nearestPortId: 'port-veraval',
    nearestPortName: 'Mangrol Harbor',
    primaryFishCatch: ['Bombay Duck', 'Ribbon Fish', 'Croaker', 'Shrimp'],
    localCoastGuardHelpline: '+91-2878-222300 / 1554',
    fleetSize: 890
  },
  {
    id: 'vil-okha-dwarka',
    name: 'Okha / Bet Dwarka',
    nativeName: 'ઓખા / બેટ દ્વારકા',
    district: 'Devbhumi Dwarka',
    state: 'Gujarat',
    basin: 'Arabian Sea',
    lat: 22.4600,
    lng: 69.0700,
    nearestPortId: 'port-veraval',
    nearestPortName: 'Okha Port',
    primaryFishCatch: ['Rock Cod', 'Jew Fish (Ghol)', 'Pomfret', 'Lobster'],
    localCoastGuardHelpline: '+91-2892-262100 / 1554',
    fleetSize: 760
  },

  // Karnataka
  {
    id: 'vil-malpe',
    name: 'Malpe Fishery Harbor (Udupi)',
    nativeName: 'ಮಲ್ಪೆ ಮೀನುಗಾರಿಕಾ ಬಂದರು',
    district: 'Udupi',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 13.3500,
    lng: 74.7000,
    nearestPortId: 'port-cochin',
    nearestPortName: 'Malpe Harbor Base',
    primaryFishCatch: ['Mackerel (Bangude)', 'Sardine (Boothai)', 'Seer Fish (Anjal)', 'Squid'],
    localCoastGuardHelpline: '+91-820-2538400 / 1554',
    fleetSize: 1500
  },
  {
    id: 'vil-karwar',
    name: 'Karwar (Baithkol Harbor)',
    nativeName: 'ಕಾರವಾರ (ಬೈತ್ಕೋಲ್)',
    district: 'Uttara Kannada',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 14.8100,
    lng: 74.1200,
    nearestPortId: 'port-cochin',
    nearestPortName: 'Karwar Baithkol Harbor',
    primaryFishCatch: ['Mackerel', 'Prawns', 'Kingfish', 'Anchovies'],
    localCoastGuardHelpline: '+91-8382-226300 / 1554',
    fleetSize: 620
  },
  {
    id: 'vil-mangalore-bunder',
    name: 'Mangalore Old Port (Bunder)',
    nativeName: 'ಮಂಗಳೂರು ಓಲ್ಡ್ ಪೋರ್ಟ್',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 12.8600,
    lng: 74.8300,
    nearestPortId: 'port-cochin',
    nearestPortName: 'Mangalore Port',
    primaryFishCatch: ['Anjal (Kingfish)', 'Prawns', 'Ribbon Fish', 'Crabs'],
    localCoastGuardHelpline: '+91-824-2405200 / 1554',
    fleetSize: 940
  },

  // Goa
  {
    id: 'vil-cutbona',
    name: 'Cutbona / Betul (Sal River)',
    nativeName: 'कटबोना (गोवा)',
    district: 'South Goa',
    state: 'Goa',
    basin: 'Arabian Sea',
    lat: 15.1500,
    lng: 73.9500,
    nearestPortId: 'port-mumbai-sassoon',
    nearestPortName: 'Mormugao Port',
    primaryFishCatch: ['Solar Shrimp', 'Squid', 'Kingfish (Visvon)', 'Mackerel'],
    localCoastGuardHelpline: '+91-832-2735100 / 1554',
    fleetSize: 580
  },

  // Andaman & Nicobar
  {
    id: 'vil-junglighat',
    name: 'Junglighat (Port Blair)',
    nativeName: 'जंगलीघाट (पोर्ट ब्लेयर)',
    district: 'South Andaman',
    state: 'Andaman & Nicobar',
    basin: 'Bay of Bengal',
    lat: 11.6600,
    lng: 92.7300,
    nearestPortId: 'port-paradip',
    nearestPortName: 'Port Blair Harbor',
    primaryFishCatch: ['Yellowfin Tuna', 'Barracuda', 'Coral Trout', 'Red Snapper'],
    localCoastGuardHelpline: '+91-3192-232155 / 1554',
    fleetSize: 310
  }
];

export interface PlaceGeoEntry {
  id: string;
  name: string;
  nativeName: string;
  district: string;
  state: string;
  basin: 'Arabian Sea' | 'Bay of Bengal' | 'Indian Ocean' | 'South China Sea' | 'Western Pacific' | 'Atlantic';
  lat: number;
  lng: number;
  placeType: 'INLAND_DISTRICT_OR_CITY' | 'COASTAL_PORT' | 'COASTAL_VILLAGE' | 'MARITIME_SECTOR';
  nearestPortGateway: string;
  distanceToCoastKm: number;
  primaryLanguage: 'kn' | 'ta' | 'ml' | 'te' | 'mr' | 'gu' | 'bn' | 'or' | 'hi' | 'en';
  aliases: string[];
}

export const INDIAN_AND_GLOBAL_PLACES_DIRECTORY: PlaceGeoEntry[] = [
  // Karnataka (Inland Districts & Coastal Ports)
  {
    id: 'place-tumkur',
    name: 'Tumakuru (Tumkur)',
    nativeName: 'ತುಮಕೂರು',
    district: 'Tumakuru',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 13.3409,
    lng: 77.1010,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Malpe Fishery Harbor / New Mangalore Port Gateway',
    distanceToCoastKm: 260,
    primaryLanguage: 'kn',
    aliases: ['tumkur', 'tumakuru', 'tumkur district', 'tumkuru', 'thumkur', 'tumkoor', 'pavagada', 'sira', 'koratagere', 'madhugiri', 'gubbi', 'kunigal', 'tiptur', 'chikkanayakanahalli', 'turuvekere']
  },
  {
    id: 'place-bengaluru',
    name: 'Bengaluru (Bangalore)',
    nativeName: 'ಬೆಂಗಳೂರು',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 12.9716,
    lng: 77.5946,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'New Mangalore Port & Chennai Port Gateway',
    distanceToCoastKm: 290,
    primaryLanguage: 'kn',
    aliases: ['bangalore', 'bengaluru', 'bangalore urban', 'bangalore rural', 'whitefield', 'electronic city', 'koramangala', 'indiranagar', 'yelahanka', 'jayanagar', 'hebbal', 'kengeri']
  },
  {
    id: 'place-mysuru',
    name: 'Mysuru (Mysore)',
    nativeName: 'ಮೈಸೂರು',
    district: 'Mysuru',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 12.2958,
    lng: 76.6394,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Mangalore Old Port Gateway',
    distanceToCoastKm: 215,
    primaryLanguage: 'kn',
    aliases: ['mysore', 'mysuru', 'nanjangud', 'hunsur', 't narasipura', 'k r nagara', 'chamundi']
  },
  {
    id: 'place-shivamogga',
    name: 'Shivamogga (Shimoga)',
    nativeName: 'ಶಿವಮೊಗ್ಗ',
    district: 'Shivamogga',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 13.9299,
    lng: 75.5681,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Bhatkal & Malpe Fishery Harbor Gateway',
    distanceToCoastKm: 135,
    primaryLanguage: 'kn',
    aliases: ['shimoga', 'shivamogga', 'bhadravathi', 'sagar', 'shikaripura', 'soraba', 'thirthahalli', 'hosanagara', 'jog falls']
  },
  {
    id: 'place-hassan',
    name: 'Hassan',
    nativeName: 'ಹಾಸನ',
    district: 'Hassan',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 13.0072,
    lng: 76.0964,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Mangalore Port Gateway',
    distanceToCoastKm: 165,
    primaryLanguage: 'kn',
    aliases: ['hassan', 'sakleshpur', 'belur', 'halebeedu', 'arasikere', 'channarayapatna', 'holenarasipura', 'arkalgud']
  },
  {
    id: 'place-hubballi',
    name: 'Hubballi - Dharwad',
    nativeName: 'ಹುಬ್ಬಳ್ಳಿ - ಧಾರವಾಡ',
    district: 'Dharwad',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 15.3647,
    lng: 75.1240,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Karwar Baithkol Harbor Base',
    distanceToCoastKm: 155,
    primaryLanguage: 'kn',
    aliases: ['hubli', 'hubballi', 'dharwad', 'navalgund', 'kundgol', 'kalghatgi']
  },
  {
    id: 'place-belagavi',
    name: 'Belagavi (Belgaum)',
    nativeName: 'ಬೆಳಗಾವಿ',
    district: 'Belagavi',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 15.8497,
    lng: 74.4977,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Goa Cutbona & Karwar Port',
    distanceToCoastKm: 110,
    primaryLanguage: 'kn',
    aliases: ['belgaum', 'belagavi', 'gokak', 'chikodi', 'bailhongal', 'athani', 'ramdurg', 'saundatti']
  },
  {
    id: 'place-davanagere',
    name: 'Davanagere',
    nativeName: 'ದಾವಣಗೆರೆ',
    district: 'Davanagere',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 14.4644,
    lng: 75.9218,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Malpe Fishery Harbor',
    distanceToCoastKm: 205,
    primaryLanguage: 'kn',
    aliases: ['davanagere', 'davangere', 'harihar', 'channagiri', 'honnali', 'jagalur']
  },
  {
    id: 'place-bellary',
    name: 'Ballari (Bellary)',
    nativeName: 'ಬಳ್ಳಾರಿ',
    district: 'Ballari',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 15.1394,
    lng: 76.9214,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Karwar & Mangalore Port Corridor',
    distanceToCoastKm: 310,
    primaryLanguage: 'kn',
    aliases: ['bellary', 'ballari', 'sandur', 'siruguppa', 'hospet', 'vijayanagara', 'hampi']
  },
  {
    id: 'place-kalaburagi',
    name: 'Kalaburagi (Gulbarga)',
    nativeName: 'ಕಲಬುರಗಿ',
    district: 'Kalaburagi',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 17.3297,
    lng: 76.8343,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Karwar & Mumbai Port Corridor',
    distanceToCoastKm: 340,
    primaryLanguage: 'kn',
    aliases: ['gulbarga', 'kalaburagi', 'aland', 'afzalpur', 'chincholi', 'sedam', 'chitapur', 'jevargi']
  },
  {
    id: 'place-chitradurga',
    name: 'Chitradurga',
    nativeName: 'ಚಿತ್ರದುರ್ಗ',
    district: 'Chitradurga',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 14.2251,
    lng: 76.3980,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Malpe & Mangalore Port Gateway',
    distanceToCoastKm: 230,
    primaryLanguage: 'kn',
    aliases: ['chitradurga', 'challakere', 'hiriyur', 'holalkere', 'hosadurga', 'molakalmuru']
  },
  {
    id: 'place-kolar',
    name: 'Kolar',
    nativeName: 'ಕೋಲಾರ',
    district: 'Kolar',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 13.1367,
    lng: 78.1291,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Chennai Kasimedu & Mangalore Harbor',
    distanceToCoastKm: 220,
    primaryLanguage: 'kn',
    aliases: ['kolar', 'kgf', 'bangarapet', 'malur', 'mulbagal', 'srinivaspur']
  },
  {
    id: 'place-mandya',
    name: 'Mandya',
    nativeName: 'ಮಂಡ್ಯ',
    district: 'Mandya',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 12.5218,
    lng: 76.8951,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Mangalore Port Gateway',
    distanceToCoastKm: 240,
    primaryLanguage: 'kn',
    aliases: ['mandya', 'maddur', 'malavalli', 'pandavapura', 'nagamangala', 'kr pet', 'srirangapatna']
  },
  {
    id: 'place-chikkamagaluru',
    name: 'Chikkamagaluru',
    nativeName: 'ಚಿಕ್ಕಮಗಳೂರು',
    district: 'Chikkamagaluru',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 13.3161,
    lng: 75.7720,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Malpe / Mangalore Fishery Harbor',
    distanceToCoastKm: 145,
    primaryLanguage: 'kn',
    aliases: ['chikmagalur', 'chikkamagaluru', 'kadur', 'tarikere', 'mudigere', 'koppa', 'sringeri', 'narasimharajapura', 'mullayanagiri']
  },
  {
    id: 'place-udupi-malpe',
    name: 'Malpe / Udupi Coastal Harbor',
    nativeName: 'ಮಲ್ಪೆ / ಉಡುಪಿ ಕರಾವಳಿ',
    district: 'Udupi',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 13.3500,
    lng: 74.7000,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'Malpe Fishery Harbor Base',
    distanceToCoastKm: 0,
    primaryLanguage: 'kn',
    aliases: ['udupi', 'malpe', 'kundapura', 'kundapur', 'kaup', 'kapu', 'karkala', 'brahmavara', 'byndoor', 'baindur', 'maravanthe', 'st marys island']
  },
  {
    id: 'place-karwar-uttara-kannada',
    name: 'Karwar / Uttara Kannada Maritime Coast',
    nativeName: 'ಕಾರವಾರ / ಉತ್ತರ ಕನ್ನಡ ಕರಾವಳಿ',
    district: 'Uttara Kannada',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 14.8100,
    lng: 74.1200,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'Karwar Baithkol Harbor Base',
    distanceToCoastKm: 0,
    primaryLanguage: 'kn',
    aliases: ['karwar', 'bhatkal', 'honnavar', 'kumta', 'ankola', 'gokarna', 'murudeshwar', 'tadadi', 'majali', 'uttara kannada', 'north canara']
  },
  {
    id: 'place-mangalore-dakshina-kannada',
    name: 'Mangalore (Kudla) / Dakshina Kannada Port',
    nativeName: 'ಮಂಗಳೂರು (ಕುಡ್ಲ) ಬಂದರು',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    basin: 'Arabian Sea',
    lat: 12.8600,
    lng: 74.8300,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'New Mangalore Port & Old Bunder Base',
    distanceToCoastKm: 0,
    primaryLanguage: 'kn',
    aliases: ['mangalore', 'mangaluru', 'kudla', 'dakshina kannada', 'south canara', 'surathkal', 'ullal', 'panambur', 'bunder', 'bantwal', 'puttur', 'belthangady', 'sullia', 'moodabidri']
  },

  // Tamil Nadu (Inland & Coastal)
  {
    id: 'place-coimbatore',
    name: 'Coimbatore',
    nativeName: 'கோயம்புத்தூர்',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 11.0168,
    lng: 76.9558,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Cochin Port (150 km) & Tuticorin Harbor',
    distanceToCoastKm: 160,
    primaryLanguage: 'ta',
    aliases: ['coimbatore', 'kovai', 'pollachi', 'mettupalayam', 'valparai', 'sulur']
  },
  {
    id: 'place-madurai',
    name: 'Madurai',
    nativeName: 'மதுரை',
    district: 'Madurai',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 9.9252,
    lng: 78.1198,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Thoothukudi / Tuticorin Port Gateway',
    distanceToCoastKm: 130,
    primaryLanguage: 'ta',
    aliases: ['madurai', 'melur', 'usilampatti', 'vadipatti', 'thirumangalam']
  },
  {
    id: 'place-trichy',
    name: 'Tiruchirappalli (Trichy)',
    nativeName: 'திருச்சிராப்பள்ளி',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 10.7905,
    lng: 78.7047,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Nagapattinam Port Gateway',
    distanceToCoastKm: 135,
    primaryLanguage: 'ta',
    aliases: ['trichy', 'tiruchirappalli', 'srirangam', 'manapparai', 'thuraiyur']
  },
  {
    id: 'place-salem',
    name: 'Salem',
    nativeName: 'சேலம்',
    district: 'Salem',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 11.6643,
    lng: 78.1460,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Cuddalore & Chennai Port',
    distanceToCoastKm: 190,
    primaryLanguage: 'ta',
    aliases: ['salem', 'attur', 'metturs', 'mettur', 'omlur', 'sankari']
  },
  {
    id: 'place-erode',
    name: 'Erode',
    nativeName: 'ஈரோடு',
    district: 'Erode',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 11.3410,
    lng: 77.7172,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Nagapattinam & Cochin Port',
    distanceToCoastKm: 210,
    primaryLanguage: 'ta',
    aliases: ['erode', 'gobichettipalayam', 'bhavani', 'perundurai', 'sathyamangalam']
  },
  {
    id: 'place-tiruppur',
    name: 'Tiruppur',
    nativeName: 'திருப்பூர்',
    district: 'Tiruppur',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 11.1085,
    lng: 77.3411,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Cochin & Tuticorin Port',
    distanceToCoastKm: 175,
    primaryLanguage: 'ta',
    aliases: ['tiruppur', 'tirupur', 'avinashi', 'palladam', 'dharapuram', 'udumalpet']
  },
  {
    id: 'place-vellore',
    name: 'Vellore',
    nativeName: 'வேலூர்',
    district: 'Vellore',
    state: 'Tamil Nadu',
    basin: 'Bay of Bengal',
    lat: 12.9165,
    lng: 79.1325,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Kasimedu & Chennai Port',
    distanceToCoastKm: 135,
    primaryLanguage: 'ta',
    aliases: ['vellore', 'katpadi', 'gudiyatham', 'pernamput', 'anicut']
  },

  // Kerala
  {
    id: 'place-thrissur',
    name: 'Thrissur',
    nativeName: 'തൃശ്ശൂർ',
    district: 'Thrissur',
    state: 'Kerala',
    basin: 'Arabian Sea',
    lat: 10.5276,
    lng: 76.2144,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Munambam / Cochin Harbor Base',
    distanceToCoastKm: 25,
    primaryLanguage: 'ml',
    aliases: ['thrissur', 'trichur', 'guruvayur', 'chavakkad', 'kodungallur', 'chalakudy']
  },
  {
    id: 'place-palakkad',
    name: 'Palakkad',
    nativeName: 'പാലക്കാട്',
    district: 'Palakkad',
    state: 'Kerala',
    basin: 'Arabian Sea',
    lat: 10.7867,
    lng: 76.6548,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Ponnani & Cochin Port Base',
    distanceToCoastKm: 90,
    primaryLanguage: 'ml',
    aliases: ['palakkad', 'palghat', 'ottapalam', 'shoranur', 'chittur', 'mannarkkad', 'alathur']
  },

  // Andhra Pradesh & Telangana
  {
    id: 'place-hyderabad',
    name: 'Hyderabad',
    nativeName: 'హైదరాబాద్',
    district: 'Hyderabad',
    state: 'Telangana',
    basin: 'Bay of Bengal',
    lat: 17.3850,
    lng: 78.4867,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Machilipatnam & Kakinada Harbor Base',
    distanceToCoastKm: 310,
    primaryLanguage: 'te',
    aliases: ['hyderabad', 'secunderabad', 'cyberabad', 'hitec city', 'telangana', 'rangareddy', 'medchal', 'warangal', 'karimnagar', 'nizamabad']
  },
  {
    id: 'place-vijayawada',
    name: 'Vijayawada',
    nativeName: 'విజయవాడ',
    district: 'NTR',
    state: 'Andhra Pradesh',
    basin: 'Bay of Bengal',
    lat: 16.5062,
    lng: 80.6480,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Machilipatnam Harbor Gateway',
    distanceToCoastKm: 65,
    primaryLanguage: 'te',
    aliases: ['vijayawada', 'bezawada', 'ntr district', 'gannavaram', 'nuzvid']
  },
  {
    id: 'place-guntur',
    name: 'Guntur',
    nativeName: 'గుంటూరు',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    basin: 'Bay of Bengal',
    lat: 16.3067,
    lng: 80.4365,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Nizampatnam & Bapatla Harbor Gateway',
    distanceToCoastKm: 60,
    primaryLanguage: 'te',
    aliases: ['guntur', 'tenali', 'narasaraopet', 'mangalagiri', 'amaravati', 'bapatla', 'nizampatnam']
  },

  // Maharashtra
  {
    id: 'place-pune',
    name: 'Pune',
    nativeName: 'पुणे',
    district: 'Pune',
    state: 'Maharashtra',
    basin: 'Arabian Sea',
    lat: 18.5204,
    lng: 73.8567,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Mumbai Sassoon Docks / JNPT Gateway',
    distanceToCoastKm: 120,
    primaryLanguage: 'mr',
    aliases: ['pune', 'poona', 'pimpri', 'chinchwad', 'pcmc', 'hadapsar', 'hinjawadi', 'kothrud', 'baramati', 'lonavala', 'shivajinagar']
  },
  {
    id: 'place-nashik',
    name: 'Nashik',
    nativeName: 'नाशिक',
    district: 'Nashik',
    state: 'Maharashtra',
    basin: 'Arabian Sea',
    lat: 19.9975,
    lng: 73.7898,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Mumbai & Palghar Harbor Gateway',
    distanceToCoastKm: 140,
    primaryLanguage: 'mr',
    aliases: ['nashik', 'nasik', 'malegaon', 'sinnar', 'igatpuri', 'niphad']
  },
  {
    id: 'place-nagpur',
    name: 'Nagpur',
    nativeName: 'नागपूर',
    district: 'Nagpur',
    state: 'Maharashtra',
    basin: 'Arabian Sea',
    lat: 21.1458,
    lng: 79.0882,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Mumbai & Paradip Maritime Corridor',
    distanceToCoastKm: 580,
    primaryLanguage: 'mr',
    aliases: ['nagpur', 'vidarbha', 'wardha', 'kamthi', 'umred', 'katol']
  },

  // Gujarat
  {
    id: 'place-ahmedabad',
    name: 'Ahmedabad',
    nativeName: 'અમદાવાદ',
    district: 'Ahmedabad',
    state: 'Gujarat',
    basin: 'Arabian Sea',
    lat: 23.0225,
    lng: 72.5714,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Bhavnagar & Gulf of Khambhat Port',
    distanceToCoastKm: 85,
    primaryLanguage: 'gu',
    aliases: ['ahmedabad', 'amdavad', 'gandhinagar', 'sanand', 'dholera', 'daskroi']
  },
  {
    id: 'place-vadodara',
    name: 'Vadodara (Baroda)',
    nativeName: 'વડોદરા',
    district: 'Vadodara',
    state: 'Gujarat',
    basin: 'Arabian Sea',
    lat: 22.3072,
    lng: 73.1812,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Dahej & Bharuch Harbor Gateway',
    distanceToCoastKm: 75,
    primaryLanguage: 'gu',
    aliases: ['vadodara', 'baroda', 'padra', 'karjan', 'waghodia', 'dabhoi']
  },
  {
    id: 'place-rajkot',
    name: 'Rajkot',
    nativeName: 'રાજકોટ',
    district: 'Rajkot',
    state: 'Gujarat',
    basin: 'Arabian Sea',
    lat: 22.3039,
    lng: 70.8022,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Bedi / Jamnagar & Porbandar Port',
    distanceToCoastKm: 90,
    primaryLanguage: 'gu',
    aliases: ['rajkot', 'morbi', 'gondal', 'jetpur', 'dhoraji', 'upleta']
  },

  // Odisha & West Bengal
  {
    id: 'place-bhubaneswar',
    name: 'Bhubaneswar',
    nativeName: 'ଭୁବନେଶ୍ୱର',
    district: 'Khordha',
    state: 'Odisha',
    basin: 'Bay of Bengal',
    lat: 20.2961,
    lng: 85.8245,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Puri & Paradip Harbor Gateway',
    distanceToCoastKm: 55,
    primaryLanguage: 'or',
    aliases: ['bhubaneswar', 'bhubaneshwar', 'khordha', 'jatni']
  },
  {
    id: 'place-cuttack',
    name: 'Cuttack',
    nativeName: 'କଟକ',
    district: 'Cuttack',
    state: 'Odisha',
    basin: 'Bay of Bengal',
    lat: 20.4625,
    lng: 85.8828,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Paradip Port Gateway',
    distanceToCoastKm: 75,
    primaryLanguage: 'or',
    aliases: ['cuttack', 'kataka', 'choudwar', 'athagarh']
  },

  // Northern & Central Hubs
  {
    id: 'place-delhi',
    name: 'Delhi NCR',
    nativeName: 'दिल्ली',
    district: 'New Delhi',
    state: 'Delhi NCR',
    basin: 'Arabian Sea',
    lat: 28.6139,
    lng: 77.2090,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Mundra & Kandla Maritime Corridor',
    distanceToCoastKm: 980,
    primaryLanguage: 'hi',
    aliases: ['delhi', 'new delhi', 'noida', 'gurugram', 'gurgaon', 'ghaziabad', 'faridabad']
  },
  {
    id: 'place-jaipur',
    name: 'Jaipur',
    nativeName: 'जयपुर',
    district: 'Jaipur',
    state: 'Rajasthan',
    basin: 'Arabian Sea',
    lat: 26.9124,
    lng: 75.7873,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Kandla & Mundra Port Corridor',
    distanceToCoastKm: 750,
    primaryLanguage: 'hi',
    aliases: ['jaipur', 'pink city', 'rajasthan', 'ajmer', 'jodhpur', 'udaipur', 'kota']
  },
  {
    id: 'place-patna',
    name: 'Patna',
    nativeName: 'पटना',
    district: 'Patna',
    state: 'Bihar',
    basin: 'Bay of Bengal',
    lat: 25.5941,
    lng: 85.1376,
    placeType: 'INLAND_DISTRICT_OR_CITY',
    nearestPortGateway: 'Haldia & Paradip Port Corridor',
    distanceToCoastKm: 560,
    primaryLanguage: 'hi',
    aliases: ['patna', 'bihar', 'gaya', 'muzaffarpur', 'bhagalpur', 'darbhanga']
  },

  // Global & Island Hubs
  {
    id: 'place-colombo',
    name: 'Colombo Harbor',
    nativeName: 'කොළඹ',
    district: 'Western Province',
    state: 'Sri Lanka',
    basin: 'Indian Ocean',
    lat: 6.9271,
    lng: 79.8612,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'Port of Colombo / Galle Fishery Gateway',
    distanceToCoastKm: 0,
    primaryLanguage: 'en',
    aliases: ['colombo', 'sri lanka', 'ceylon', 'galle', 'negombo', 'jaffna', 'trincomalee']
  },
  {
    id: 'place-male',
    name: 'Malé / Maldives Atolls',
    nativeName: 'މާލެ',
    district: 'Kaafu Atoll',
    state: 'Maldives',
    basin: 'Arabian Sea',
    lat: 4.1755,
    lng: 73.5093,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'Malé Commercial & Fishery Harbor',
    distanceToCoastKm: 0,
    primaryLanguage: 'en',
    aliases: ['male', 'maldives', 'hulhumale', 'addu', 'ari atoll', 'dhaalu']
  },
  {
    id: 'place-dubai',
    name: 'Dubai & Arabian Gulf Port',
    nativeName: 'دبي',
    district: 'Dubai',
    state: 'United Arab Emirates',
    basin: 'Arabian Sea',
    lat: 25.2048,
    lng: 55.2708,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'Port Rashid & Jebel Ali Gateway',
    distanceToCoastKm: 0,
    primaryLanguage: 'en',
    aliases: ['dubai', 'uae', 'emirates', 'abu dhabi', 'sharjah', 'fujairah', 'muscat', 'oman', 'doha', 'qatar']
  },
  {
    id: 'place-singapore',
    name: 'Singapore Maritime Strait',
    nativeName: 'Singapore',
    district: 'Strait of Malacca',
    state: 'Singapore',
    basin: 'South China Sea',
    lat: 1.3521,
    lng: 103.8198,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'Port of Singapore / Jurong Gateway',
    distanceToCoastKm: 0,
    primaryLanguage: 'en',
    aliases: ['singapore', 'malacca', 'johor', 'penang', 'kuala lumpur', 'malaysia']
  },
  {
    id: 'place-port-blair',
    name: 'Port Blair & Andaman Sector',
    nativeName: 'पोर्ट ब्लेयर',
    district: 'South Andaman',
    state: 'Andaman and Nicobar',
    basin: 'Bay of Bengal',
    lat: 11.6234,
    lng: 92.7265,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'Haddo Wharf / Phoenix Bay Jetty Base',
    distanceToCoastKm: 0,
    primaryLanguage: 'hi',
    aliases: ['port blair', 'andaman', 'nicobar', 'havelock', 'swaraj dweep', 'neil island', 'diglipur']
  },
  {
    id: 'place-chittagong',
    name: 'Chittagong (Chattogram) Port',
    nativeName: 'চট্টগ্রাম',
    district: 'Chittagong',
    state: 'Bangladesh',
    basin: 'Bay of Bengal',
    lat: 22.3569,
    lng: 91.7832,
    placeType: 'COASTAL_PORT',
    nearestPortGateway: 'Chittagong Fishery & Commercial Port',
    distanceToCoastKm: 0,
    primaryLanguage: 'bn',
    aliases: ['chittagong', 'chattogram', 'bangladesh', 'coxs bazar', 'dhaka', 'mongla']
  }
];

export const DEMO_CAPTAINS: UserProfile[] = [
  {
    id: 'user-velu',
    name: 'Captain K. Velumani',
    phone: '+91 98401 23456',
    boatName: 'Kadalarasan-IX',
    boatRegNumber: 'IND-TN-02-MM-1842',
    boatType: 'Motorized Trawler',
    state: 'Tamil Nadu',
    villageOrPort: 'Kasimedu (Royapuram)',
    language: 'ta',
    isLoggedIn: true,
    crewMembersCount: 6,
    createdAt: '2026-01-15T06:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'user-joseph',
    name: 'Captain Joseph Fernandez',
    phone: '+91 94471 89012',
    boatName: 'Sea Queen-VII',
    boatRegNumber: 'IND-KL-01-FB-2094',
    boatType: 'Deep-Sea Longliner & Gillnetter',
    state: 'Kerala',
    villageOrPort: 'Vizhinjam Marine Village',
    language: 'ml',
    isLoggedIn: true,
    crewMembersCount: 8,
    createdAt: '2026-02-10T08:30:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'user-srinivas',
    name: 'Captain M. Srinivas Rao',
    phone: '+91 98480 54321',
    boatName: 'Matsya Ganga',
    boatRegNumber: 'IND-AP-03-MM-4019',
    boatType: 'Motorized Trawler',
    state: 'Andhra Pradesh',
    villageOrPort: 'Jalaripeta / Bheemili',
    language: 'te',
    isLoggedIn: true,
    crewMembersCount: 7,
    createdAt: '2026-03-01T04:15:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'user-patel',
    name: 'Captain Mansukh Patel',
    phone: '+91 98250 99887',
    boatName: 'Somnath Sagar',
    boatRegNumber: 'IND-GJ-11-MM-8841',
    boatType: 'Motorized Trawler',
    state: 'Gujarat',
    villageOrPort: 'Veraval Fishing Harbor',
    language: 'gu',
    isLoggedIn: true,
    crewMembersCount: 10,
    createdAt: '2026-02-20T07:45:00Z',
    lastLoginAt: new Date().toISOString()
  }
];

/**
 * Smart Village, District, Town & Place Condition Identifier Engine
 * Resolves ANY Place (e.g., Tumkur / Tumakuru, Kasimedu, Bangalore, Coimbatore, Pune, etc.) or GPS Coordinates,
 * links to the exact coordinates, nearest coastal port gateway, and closest ocean ARGO profiler,
 * then computes real-time location track, PFZ marine biodata, and regional language safety advisory.
 * Works 100% OFFLINE & ONLINE.
 */
export function identifyVillageOrStateCondition(
  query: string, 
  floats: ArgoFloat[],
  isOffline: boolean = false
): VillageConditionResult {
  const cleanQ = (query || '').trim();
  const lowerQ = cleanQ.toLowerCase();

  // 0. Check for GPS Coordinates in query (e.g. "13.34, 77.10", "13.34°N 77.10°E", "13.34 77.10")
  const coordRegex = /([+-]?\d+(?:\.\d+)?)\s*°?\s*([NSns])?\s*[,/ ]+\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([EWew])?/;
  const coordMatch = cleanQ.match(coordRegex);

  let customCoordParsed = false;
  let parsedLat = 13.0827;
  let parsedLng = 80.2707;

  if (coordMatch) {
    let latVal = parseFloat(coordMatch[1]);
    const latDir = coordMatch[2]?.toUpperCase();
    if (latDir === 'S') latVal = -Math.abs(latVal);

    let lngVal = parseFloat(coordMatch[3]);
    const lngDir = coordMatch[4]?.toUpperCase();
    if (lngDir === 'W') lngVal = -Math.abs(lngVal);

    if (!isNaN(latVal) && !isNaN(lngVal) && latVal >= -90 && latVal <= 90 && lngVal >= -180 && lngVal <= 180) {
      parsedLat = latVal;
      parsedLng = lngVal;
      customCoordParsed = true;
    }
  }

  // 1. Check for exact or partial village match in coastal villages
  let matchedVillage = !customCoordParsed ? COASTAL_VILLAGES.find(v => 
    v.name.toLowerCase().includes(lowerQ) ||
    v.district.toLowerCase().includes(lowerQ) ||
    v.nativeName.toLowerCase().includes(lowerQ) ||
    lowerQ.includes(v.name.toLowerCase()) ||
    lowerQ.includes(v.district.toLowerCase())
  ) : undefined;

  // 2. Check for matching entry in INDIAN_AND_GLOBAL_PLACES_DIRECTORY (e.g. Tumkur, Bangalore, etc.)
  let matchedPlace = !customCoordParsed ? INDIAN_AND_GLOBAL_PLACES_DIRECTORY.find(p =>
    p.name.toLowerCase().includes(lowerQ) ||
    p.district.toLowerCase().includes(lowerQ) ||
    p.nativeName.toLowerCase().includes(lowerQ) ||
    lowerQ.includes(p.name.toLowerCase()) ||
    lowerQ.includes(p.district.toLowerCase()) ||
    p.aliases.some(a => lowerQ.includes(a) || a.includes(lowerQ))
  ) : undefined;

  // 3. Check for state match if no specific village/place
  let matchedState = (!customCoordParsed && !matchedPlace && !matchedVillage) ? COASTAL_STATES.find(s => 
    lowerQ.includes(s.name.toLowerCase()) ||
    s.name.toLowerCase().includes(lowerQ) ||
    s.districts.some(d => lowerQ.includes(d.toLowerCase()))
  ) : undefined;

  let villageName = '';
  let district = '';
  let state = '';
  let basin: 'Bay of Bengal' | 'Arabian Sea' | 'Indian Ocean' | 'South China Sea' | 'Western Pacific' | 'Atlantic' = 'Bay of Bengal';
  let lat = 13.0827;
  let lng = 80.2707;
  let isCustomGeocoded = false;
  let isInlandPlace = false;
  let placeType: 'COASTAL_VILLAGE' | 'COASTAL_PORT' | 'INLAND_DISTRICT_OR_CITY' | 'MARITIME_SECTOR' = 'COASTAL_VILLAGE';
  let nearestPortGateway = '';
  let distanceToCoastKm = 0;

  if (customCoordParsed) {
    isCustomGeocoded = true;
    lat = parsedLat;
    lng = parsedLng;
    villageName = `Coordinates (${parsedLat.toFixed(3)}°N, ${parsedLng.toFixed(3)}°E)`;
    district = 'GPS Location Sector';
    
    // Determine basin and distance to coast
    if (parsedLng < 77.5) {
      basin = 'Arabian Sea';
      state = parsedLat < 8.5 ? 'Indian Ocean Zone' : parsedLat < 15 ? 'Karnataka / Kerala Coast' : 'Maharashtra / Gujarat Coast';
      nearestPortGateway = parsedLat < 13 ? 'Cochin / Mangalore Port Base' : 'Malpe / Mumbai Port Base';
      distanceToCoastKm = Math.round(Math.abs(parsedLng - 74.0) * 110);
    } else {
      basin = 'Bay of Bengal';
      state = parsedLat < 12 ? 'Tamil Nadu Coast' : parsedLat < 18 ? 'Andhra Pradesh Coast' : 'Odisha / Bengal Coast';
      nearestPortGateway = parsedLat < 13 ? 'Kasimedu / Chennai Port Base' : 'Visakhapatnam / Paradip Port Base';
      distanceToCoastKm = Math.round(Math.abs(parsedLng - 80.2) * 110);
    }
    isInlandPlace = distanceToCoastKm > 25;
    placeType = isInlandPlace ? 'INLAND_DISTRICT_OR_CITY' : 'MARITIME_SECTOR';
  } else if (matchedPlace) {
    villageName = matchedPlace.name;
    district = matchedPlace.district;
    state = matchedPlace.state;
    basin = matchedPlace.basin;
    lat = matchedPlace.lat;
    lng = matchedPlace.lng;
    placeType = matchedPlace.placeType;
    isInlandPlace = matchedPlace.placeType === 'INLAND_DISTRICT_OR_CITY';
    nearestPortGateway = matchedPlace.nearestPortGateway;
    distanceToCoastKm = matchedPlace.distanceToCoastKm;
  } else if (matchedVillage) {
    villageName = matchedVillage.name;
    district = matchedVillage.district;
    state = matchedVillage.state;
    basin = matchedVillage.basin;
    lat = matchedVillage.lat;
    lng = matchedVillage.lng;
    placeType = matchedVillage.name.toLowerCase().includes('harbor') || matchedVillage.name.toLowerCase().includes('port')
      ? 'COASTAL_PORT'
      : 'COASTAL_VILLAGE';
    isInlandPlace = false;
    nearestPortGateway = matchedVillage.nearestPortName;
    distanceToCoastKm = 0;
  } else if (matchedState) {
    state = matchedState.name;
    basin = matchedState.basin;
    placeType = 'MARITIME_SECTOR';
    isInlandPlace = false;
    
    // Check if the query mentioned a specific district in this state
    const matchedDistrictName = matchedState.districts.find(d => lowerQ.includes(d.toLowerCase()));
    
    // Pick the most representative coastal coordinate for the state
    const stateVillages = COASTAL_VILLAGES.filter(v => v.state === matchedState?.name);
    if (stateVillages.length > 0) {
      const rep = stateVillages[0];
      villageName = matchedDistrictName
        ? `${matchedDistrictName} Sector (${matchedState.name})`
        : `${matchedState.name} Maritime Sector`;
      district = matchedDistrictName || rep.district;
      lat = rep.lat;
      lng = rep.lng;
      nearestPortGateway = rep.nearestPortName;
      distanceToCoastKm = matchedDistrictName && !['udupi', 'dakshina kannada', 'uttara kannada', 'chennai', 'thiruvananthapuram', 'mumbai'].includes(matchedDistrictName.toLowerCase()) ? 180 : 0;
      isInlandPlace = distanceToCoastKm > 30;
    } else {
      villageName = `${matchedState.name} Maritime Sector`;
      district = matchedState.districts[0] || 'Coastal Belt';
      lat = matchedState.basin === 'Arabian Sea' ? 15.0 : 16.0;
      lng = matchedState.basin === 'Arabian Sea' ? 73.5 : 82.5;
      nearestPortGateway = matchedState.basin === 'Arabian Sea' ? 'Malpe / Cochin Port Base' : 'Kasimedu / Visakhapatnam Port Base';
      distanceToCoastKm = 0;
    }
  } else {
    // Custom / Unlisted Place fallback heuristic:
    // Check if query hints at Karnataka, West coast (Arabian Sea) vs East coast (Bay of Bengal)
    isCustomGeocoded = true;
    const formattedName = cleanQ
      ? cleanQ.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Identified Custom Location';
    villageName = formattedName;
    district = 'Identified District';

    const karnatakaKeywords = ['karnataka', 'kannada', 'tumkur', 'tumakuru', 'bangalore', 'bengaluru', 'mysore', 'mysuru', 'hubli', 'dharwad', 'shivamogga', 'udupi', 'malpe', 'karwar', 'mangalore', 'kudla', 'hassan', 'belgaum', 'ballari', 'bellary', 'raichur', 'bidar', 'kalaburagi', 'gulbarga'];
    const isKarnataka = karnatakaKeywords.some(k => lowerQ.includes(k));

    const westCoastKeywords = ['kerala', 'kochi', 'calicut', 'trivandrum', 'mumbai', 'goa', 'gujarat', 'mangalore', 'arabian', 'surat', 'kutch', 'ratnagiri', 'konkan', 'malabar', 'karavali', 'maharashtra', 'karnataka', 'delhi', 'punjab', 'rajasthan', 'dubai', 'arabia'];
    const isWest = isKarnataka || westCoastKeywords.some(k => lowerQ.includes(k));

    if (isKarnataka) {
      state = 'Karnataka';
      basin = 'Arabian Sea';
      lat = 13.5;
      lng = 76.5;
      placeType = 'INLAND_DISTRICT_OR_CITY';
      isInlandPlace = true;
      nearestPortGateway = 'Malpe Fishery Harbor / New Mangalore Port Base';
      distanceToCoastKm = 210;
    } else if (isWest) {
      state = 'West Coast Maritime Belt';
      basin = 'Arabian Sea';
      lat = 14.5;
      lng = 74.0;
      placeType = 'MARITIME_SECTOR';
      nearestPortGateway = 'West Coast Maritime Base (Malpe / Mumbai)';
      distanceToCoastKm = 40;
      isInlandPlace = false;
    } else {
      state = 'East Coast Maritime Belt';
      basin = 'Bay of Bengal';
      lat = 15.5;
      lng = 81.5;
      placeType = 'MARITIME_SECTOR';
      nearestPortGateway = 'East Coast Maritime Base (Kasimedu / Visakhapatnam)';
      distanceToCoastKm = 40;
      isInlandPlace = false;
    }
  }

  // 4. Find Nearest ARGO Float in the corresponding Basin
  let nearestFloat = floats[0];
  let minDistance = 999999;

  floats.forEach(fl => {
    const dist = calculateDistanceKm(lat, lng, fl.lat, fl.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestFloat = fl;
    }
  });

  // 5. Calculate Risk Category & Recommendations
  const isHighTchp = nearestFloat.tchp > 50;
  const isHighWave = nearestFloat.waveHeight >= 2.5;
  const isHighWind = nearestFloat.windSpeedKnots >= 28;

  let riskLevel = nearestFloat.riskLevel;
  let riskCategory = nearestFloat.riskCategory;
  let recommendation: 'SAFE_TO_SAIL' | 'CAUTION_NEAR_COAST' | 'HAZARDOUS_DO_NOT_VENTURE' = 'SAFE_TO_SAIL';
  let safeDistanceNauticalMiles = 35;
  let advisoryTitle = 'Favorable Ocean Weather';
  let advisorySummary = isInlandPlace
    ? `Calm to moderate maritime weather off ${villageName}'s connected coast (${nearestPortGateway}). Ocean conditions are favorable for operations.`
    : `Calm to moderate sea state off ${villageName}. Favorable conditions for coastal & deep-sea operations.`;
  
  let nativeAdvisory = 'கடல் நிலை சாதகமாக உள்ளது. இயல்பான மீன்பிடிப்புக்கு செல்லலாம்.';

  if (state.includes('Karnataka')) {
    nativeAdvisory = `ತುಮಕೂರು ಮತ್ತು ಕರ್ನಾಟಕ ಕರಾವಳಿ (ಮಲ್ಪೆ / ಮಂಗಳೂರು ಬಂದರು) ವಲಯದಲ್ಲಿ ಸಮುದ್ರ ಸ್ಥಿತಿ ಅನುಕೂಲಕರವಾಗಿದೆ. ಸಾಮಾನ್ಯ ಕಾರ್ಯಾಚರಣೆಗೆ ತೆರಳಬಹುದು.`;
  } else if (state.includes('Kerala')) {
    nativeAdvisory = `കടൽ ശാന്തമാണ്. മത്സ്യബന്ധനത്തിന് തടസ്സങ്ങളില്ല.`;
  } else if (state.includes('Andhra')) {
    nativeAdvisory = `సముద్ర వాతావరణం అనుకూలంగా ఉంది. చేపల వేటకు వెళ్ళవచ్చు.`;
  } else if (state.includes('Maharashtra')) {
    nativeAdvisory = `समुद्रातील हवामान अनुकूल आहे. मासेमारीसाठी सुरक्षित परिस्थिती आहे.`;
  } else if (state.includes('Gujarat')) {
    nativeAdvisory = `દરિયાઈ હવામાન અનુકૂળ છે. માછીમારી માટે સલામત છે.`;
  } else if (state.includes('Odisha')) {
    nativeAdvisory = `ସମୁଦ୍ର ସ୍ଥିତି ଅନୁକୂଳ ଅଛି. ମତ୍ସ୍ୟ ଶିକାର ପାଇଁ ଯାଇପାରିବେ।`;
  } else if (state.includes('Bengal')) {
    nativeAdvisory = `সমুদ্রের অবস্থা শান্ত ও অনুকূল। মাছ ধরার জন্য নিরাপদ।`;
  } else if (state.includes('Tamil')) {
    nativeAdvisory = `கடல் நிலை சாதகமாக உள்ளது. இயல்பான மீன்பிடிப்புக்கு செல்லலாம்.`;
  } else {
    nativeAdvisory = `समुद्री मौसम अनुकूल है। सामान्य संचालन के लिए सुरक्षित स्थिति है।`;
  }

  if (isHighTchp || isHighWind || nearestFloat.riskLevel === 'HIGH_RISK') {
    riskLevel = 'HIGH_RISK';
    recommendation = 'HAZARDOUS_DO_NOT_VENTURE';
    safeDistanceNauticalMiles = 0;
    advisoryTitle = 'CRITICAL: Severe Sea Hazard / Cyclone Heat Energy';
    advisorySummary = `Extreme risk detected near ${villageName} (linked to ARGO Buoy #${nearestFloat.wmoId}, ${minDistance} km away). High TCHP fuel (${nearestFloat.tchp} kJ/cm²) and winds at ${nearestFloat.windSpeedKnots} knots. Total venture ban recommended.`;
    
    if (state.includes('Karnataka')) {
      nativeAdvisory = `ಎಚ್ಚರಿಕೆ! ${villageName} ಮತ್ತು ಕರ್ನಾಟಕ ಕರಾವಳಿ (ಮಲ್ಪೆ / ಮಂಗಳೂರು) ಭಾಗದಲ್ಲಿ ಚಂಡಮಾರುತದ ತೀವ್ರತೆ ಹಾಗೂ ಬಿರುಗಾಳಿ ಬೀಸುವ ಸಾಧ್ಯತೆ ಇದೆ. ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯಬೇಡಿ!`;
    } else if (state.includes('Tamil')) {
      nativeAdvisory = `எச்சரிக்கை! ${villageName} கடல் பகுதியில் புயல் வெப்ப ஆற்றல் மற்றும் பலத்த காற்று உள்ளது. கடலுக்குள் செல்ல வேண்டாம்!`;
    } else if (state.includes('Kerala')) {
      nativeAdvisory = `ജാഗ്രത! ${villageName} തീരത്ത് ഉയർന്ന കാറ്റും ചുഴലിക്കാറ്റ് ഭീഷണിയും. മത്സ്യത്തൊഴിലാളികൾ കടലിൽ പോകരുത്.`;
    } else if (state.includes('Andhra')) {
      nativeAdvisory = `హెచ్చరిక! ${villageName} సముద్రంలో తుఫాను తీవ్రత మరియు బలమైన గాಲುలు ఉన్నాయి. చేపల వేటకు వెళ్ళవద్దు.`;
    } else if (state.includes('Odisha')) {
      nativeAdvisory = `ଚେତାବନୀ! ${villageName} ଉପକୂଳରେ ବାତ୍ୟା ସମ୍ଭାବନା ଓ ଉଚ୍ଚ ତରଙ୍ଗ. ସମୁଦ୍ରକୁ ଯାଆନ୍ତୁ ନାହିଁ।`;
    } else if (state.includes('Bengal')) {
      nativeAdvisory = `সতর্কবার্তা! ${villageName} উপকূলে ঘূর্ণিঝড়ের সম্ভাবনা ও উত্তাল সমুদ্র। সমুদ্রে মাছ ধরতে যাবেন না।`;
    } else if (state.includes('Maharashtra')) {
      nativeAdvisory = `धोका! ${villageName} व कोकण किनारपट्टीवर चक्रीवादळाची शक्यता आणि जोरदार वारे. समुद्रात जाऊ नये.`;
    } else if (state.includes('Gujarat')) {
      nativeAdvisory = `ચેતવણી! ${villageName} દરિયાકાંઠે વાવાઝોડાનું જોખમ અને ભારે મોજાં. દરિયો ખેડવો નહિ.`;
    } else {
      nativeAdvisory = `चेतावनी! ${villageName} तटीय क्षेत्र में चक्रवाती हवाएं और समुद्र में भारी हलचल। समुद्र में न जाएं।`;
    }
  } else if (isHighWave || nearestFloat.riskLevel === 'MODERATE_RISK') {
    riskLevel = 'MODERATE_RISK';
    recommendation = 'CAUTION_NEAR_COAST';
    safeDistanceNauticalMiles = 8;
    advisoryTitle = 'CAUTION: Rough Swells & Strong Coastal Currents';
    advisorySummary = `Rough sea state around ${villageName}'s coastal zone. Waves reaching ${nearestFloat.waveHeight}m. Small artisanal crafts should stay within 8 nautical miles of the harbor.`;
    
    if (state.includes('Karnataka')) {
      nativeAdvisory = `ಜಾಗ್ರತೆ! ಕರ್ನಾಟಕ ಕರಾವಳಿ ಮತ್ತು ${villageName} ಸಮೀಪದ ಸಮುದ್ರದಲ್ಲಿ ಅಲೆಗಳ ಅಬ್ಬರ ಹೆಚ್ಚಾಗಿದೆ (${nearestFloat.waveHeight} ಮೀಟರ್). ಸಣ್ಣ ದೋಣಿಗಳು ಕರಾವಳಿಯಿಂದ 8 ನಾಟಿಕಲ್ ಮೈಲಿ ಒಳಗೆ ಇರಬೇಕು.`;
    } else if (state.includes('Tamil')) {
      nativeAdvisory = 'எச்சரிக்கையுடன் செயல்படவும். சிறிய படகுகள் கரைக்கு அருகில் 8 நாட்டிகல் மைல்களுக்குள் மட்டும் தொழில் செய்யவும்.';
    } else if (state.includes('Kerala')) {
      nativeAdvisory = `ജാഗ്രത പാലിക്കുക! ഉയർന്ന തിരമാലകൾ സാധ്യത ഉള്ളതിനാൽ ചെറിയ വള്ളങ്ങൾ തീരത്തോടടുത്ത് മാത്രം പ്രവർത്തിക്കുക.`;
    } else if (state.includes('Andhra')) {
      nativeAdvisory = `జాగ్రత్త! సముద్ర అలల తీవ్రత ఎక్కువగా ఉంది. చిన్న పడవలు తీరానికి సమీపంలోనే ఉండాలి.`;
    } else if (state.includes('Maharashtra')) {
      nativeAdvisory = `सावधान! समुद्रात लाटांचा वेग जास्त आहे. लहान बोटींनी किनाऱ्याजवळच राहावे.`;
    } else if (state.includes('Gujarat')) {
      nativeAdvisory = `સાવધાન! દરિયામાં મોજાંનું જોખમ છે. નાની બોટોએ કાંઠા નજીક રહેવું.`;
    }
  }

  const tideAndCurrentStatus = nearestFloat.waveHeight > 2.0 
    ? 'Turbulent tidal rip current running along continental shelf (2.4 knots)' 
    : 'Gentle coastal drift with normal spring/neap tidal cycle';

  // 6. Generate Location Track and Marine Biodata
  const trackInfo = generateLocationTrack(
    lat,
    lng,
    nearestFloat.lat,
    nearestFloat.lng,
    villageName,
    `ARGO #${nearestFloat.wmoId}`,
    state,
    basin
  );

  const biodata = generateMarineBiodata(
    lat,
    lng,
    nearestFloat,
    villageName,
    state,
    basin
  );

  return {
    query: cleanQ,
    villageName,
    district,
    state,
    basin,
    lat,
    lng,
    matchedVillage,
    nearestFloat,
    distanceToFloatKm: minDistance,
    riskLevel,
    riskCategory,
    advisoryTitle,
    advisorySummary,
    nativeAdvisory,
    safeDistanceNauticalMiles,
    tideAndCurrentStatus,
    recommendation,
    isCustomGeocoded,
    offlineEstimated: isOffline,
    isInlandPlace,
    placeType,
    nearestPortGateway: nearestPortGateway || (basin === 'Arabian Sea' ? 'Malpe / Mangalore Port Base' : 'Kasimedu / Chennai Port Base'),
    distanceToCoastKm,
    trackInfo,
    biodata,
    timestamp: new Date().toISOString()
  };
}
