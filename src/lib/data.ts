export type Service = { id: string; name: string; category: string; basePrice: number };
export type Doctor = { id: string; name: string; specialty: string; experience: number; timings: string; hospitalId: string; fee: number };
export type HospitalService = { serviceId: string; price: number };
export type Hospital = {
  id: string; name: string; city: string; state: string; pincode: string; area?: string;
  rating: number; reviews: number; type: string; lat: number; lng: number;
  phone: string; facilities: string[]; services: HospitalService[]; about: string;
};

export const SERVICES: Service[] = [
  { id: "opd", name: "OPD Consultation", category: "General", basePrice: 300 },
  { id: "emergency", name: "Emergency Care", category: "Emergency", basePrice: 1500 },
  { id: "icu", name: "ICU (per day)", category: "Critical Care", basePrice: 8000 },
  { id: "mri", name: "MRI Scan", category: "Radiology", basePrice: 6500 },
  { id: "xray", name: "X-Ray", category: "Radiology", basePrice: 450 },
  { id: "ct", name: "CT Scan", category: "Radiology", basePrice: 3500 },
  { id: "blood", name: "Blood Test (CBC)", category: "Lab", basePrice: 350 },
  { id: "ecg", name: "ECG", category: "Cardiology", basePrice: 300 },
  { id: "echo", name: "2D Echo", category: "Cardiology", basePrice: 2000 },
  { id: "dental", name: "Dental Checkup", category: "Dental", basePrice: 400 },
  { id: "eye", name: "Eye Checkup", category: "Ophthalmology", basePrice: 350 },
  { id: "cataract", name: "Cataract Surgery", category: "Ophthalmology", basePrice: 25000 },
  { id: "ultrasound", name: "Ultrasound", category: "Radiology", basePrice: 1200 },
  { id: "physio", name: "Physiotherapy Session", category: "Rehab", basePrice: 500 },
  { id: "maternity", name: "Normal Delivery Package", category: "Maternity", basePrice: 22000 },
  { id: "dialysis", name: "Dialysis Session", category: "Nephrology", basePrice: 2500 },
  { id: "chemo", name: "Chemotherapy Session", category: "Oncology", basePrice: 12000 },
  { id: "onco", name: "Oncology Consultation", category: "Oncology", basePrice: 800 },
  { id: "panchakarma", name: "Panchakarma Therapy", category: "Ayurveda", basePrice: 1800 },
  { id: "thyroid", name: "Thyroid Profile", category: "Lab", basePrice: 600 },
  { id: "diabetes", name: "Diabetes Screening", category: "Lab", basePrice: 250 },
  { id: "vaccination", name: "Vaccination", category: "General", basePrice: 500 },
  { id: "ortho", name: "Orthopedic Consultation", category: "Orthopedics", basePrice: 500 },
  { id: "pediatric", name: "Pediatric Consultation", category: "Pediatrics", basePrice: 400 },
];

const S = (ids: string[], mult: number) =>
  ids.map((id) => ({ serviceId: id, price: Math.round((SERVICES.find((s) => s.id === id)!.basePrice * mult) / 10) * 10 }));

const GEN = ["opd", "emergency", "xray", "blood", "ecg", "ultrasound", "diabetes", "vaccination", "pediatric"];

export const HOSPITALS: Hospital[] = [
  { id: "sankeshwar-mission", name: "Sankeshwar Mission Hospital", city: "Sankeshwar", state: "Karnataka", pincode: "591313", rating: 4.5, reviews: 29, type: "General Hospital", lat: 16.2672, lng: 74.4818, phone: "+91 8333 272 101", facilities: ["24x7 Emergency", "Pharmacy", "Ambulance", "Lab"], services: S([...GEN, "maternity", "physio"], 0.9), about: "A trusted community general hospital serving Sankeshwar and surrounding villages." },
  { id: "shidalali", name: "Shidalali Multi-Speciality Hospital", city: "Sankeshwar", state: "Karnataka", pincode: "591313", rating: 4.8, reviews: 26, type: "Multi-Speciality Hospital", lat: 16.2701, lng: 74.4862, phone: "+91 8333 272 202", facilities: ["ICU", "Operation Theatre", "Pharmacy", "Ambulance", "Parking"], services: S([...GEN, "icu", "ct", "echo", "ortho", "dialysis", "thyroid"], 1.05), about: "Modern multi-speciality care with ICU, dialysis and advanced diagnostics." },
  { id: "vivekananda", name: "Vivekananda Speciality Hospital (Vivekananda Hospital)", city: "Sankeshwar", state: "Karnataka", pincode: "591313", rating: 4.4, reviews: 38, type: "Speciality Hospital", lat: 16.2644, lng: 74.4889, phone: "+91 8333 272 303", facilities: ["ICU", "Lab", "Pharmacy", "Cashless Insurance"], services: S([...GEN, "icu", "echo", "ortho", "physio", "thyroid"], 1.0), about: "Speciality hospital focused on cardiology, orthopedics and critical care." },
  { id: "rukmini", name: "Rukmini Multispeciality Hospital", city: "Sankeshwar", state: "Karnataka", pincode: "591313", rating: 4.2, reviews: 42, type: "Multi-Speciality Hospital", lat: 16.2615, lng: 74.4801, phone: "+91 8333 272 404", facilities: ["Maternity Ward", "NICU", "Pharmacy", "Lab"], services: S([...GEN, "maternity", "ct", "thyroid", "dental"], 0.95), about: "Known for maternity, pediatrics and affordable multispeciality treatment." },
  { id: "patil-care", name: "Patil Care Hospital", city: "Sankeshwar", state: "Karnataka", pincode: "591313", rating: 4.4, reviews: 14, type: "Hospital", lat: 16.2689, lng: 74.4775, phone: "+91 8333 272 505", facilities: ["Pharmacy", "Lab", "Ambulance"], services: S(["opd", "emergency", "xray", "blood", "ecg", "diabetes", "ortho", "physio"], 0.85), about: "Personalised, affordable care for everyday health needs." },
  { id: "mm-joshi-eye", name: "M M Joshi Eye Hospital", city: "Sankeshwar", state: "Karnataka", pincode: "591313", rating: 5.0, reviews: 920, type: "Eye Care Center", lat: 16.2658, lng: 74.4841, phone: "+91 8333 272 606", facilities: ["Laser Suite", "Optical Store", "Cashless Insurance", "Parking"], services: S(["eye", "cataract", "opd", "diabetes"], 1.0), about: "Renowned eye care centre with advanced cataract and LASIK surgery." },
  { id: "sbss-krishna", name: "SBSS Krishna Ayurvedic Medical College & Hospital", city: "Sankeshwar", state: "Karnataka", pincode: "591313", rating: 4.5, reviews: 78, type: "Ayurvedic Hospital", lat: 16.2735, lng: 74.4903, phone: "+91 8333 272 707", facilities: ["Panchakarma Centre", "Herbal Pharmacy", "Yoga Hall"], services: S(["opd", "panchakarma", "physio", "diabetes", "blood"], 0.7), about: "Ayurvedic teaching hospital offering Panchakarma and holistic therapies." },
  { id: "banashankari", name: "Banashankari Hospital", city: "Sankeshwar", state: "Karnataka", pincode: "591313", rating: 4.6, reviews: 16, type: "Hospital", lat: 16.2627, lng: 74.4858, phone: "+91 8333 272 808", facilities: ["Pharmacy", "Lab", "Dental Clinic"], services: S(["opd", "emergency", "xray", "blood", "dental", "pediatric", "vaccination", "ecg"], 0.9), about: "Family hospital with dental, pediatric and general medicine services." },
  { id: "apoorva", name: "Apoorva Multispeciality Hospital", city: "Belagavi / Belgaum", state: "Karnataka", pincode: "590001", rating: 4.3, reviews: 112, type: "Multi-Speciality Hospital", lat: 15.8562, lng: 74.5102, phone: "+91 831 240 1111", facilities: ["ICU", "Operation Theatre", "Pharmacy", "Cashless Insurance"], services: S([...GEN, "icu", "mri", "ct", "ortho", "echo"], 1.15), about: "Multispeciality hospital in Belagavi with advanced imaging and surgery." },
  { id: "kles-kore", name: "KLES Dr. Prabhakar Kore Hospital & Medical Research Centre", city: "Belagavi / Belgaum", state: "Karnataka", pincode: "590001", rating: 4.4, reviews: 3200, type: "Tertiary Multi-Speciality Hospital", lat: 15.8836, lng: 74.5186, phone: "+91 831 247 3777", facilities: ["1000+ Beds", "ICU", "Cath Lab", "Blood Bank", "Helipad", "Cashless Insurance"], services: S([...GEN, "icu", "mri", "ct", "echo", "dialysis", "ortho", "thyroid", "dental", "eye", "onco", "maternity"], 1.25), about: "One of North Karnataka's largest tertiary care and research hospitals." },
  { id: "kle-cancer", name: "KLE Cancer Hospital", city: "Belagavi / Belgaum", state: "Karnataka", pincode: "590001", rating: 4.5, reviews: 640, type: "Cancer Hospital", lat: 15.8801, lng: 74.5213, phone: "+91 831 247 3888", facilities: ["Radiation Oncology", "Chemo Day Care", "PET-CT", "Pharmacy"], services: S(["onco", "chemo", "ct", "mri", "blood", "opd"], 1.1), about: "Dedicated comprehensive cancer care with radiation and medical oncology." },
  { id: "dakshata", name: "Dakshata Hospital Pvt Ltd", city: "Belagavi / Belgaum", state: "Karnataka", pincode: "590001", area: "Khanapur Road, Tilakwadi", rating: 4.2, reviews: 185, type: "Private Hospital", lat: 15.8378, lng: 74.5049, phone: "+91 831 248 2222", facilities: ["ICU", "Pharmacy", "Lab", "Ambulance"], services: S([...GEN, "icu", "ct", "ortho", "physio"], 1.05), about: "Private hospital on Khanapur Road, Tilakwadi offering round-the-clock care." },
  { id: "mg-cancer", name: "Mahatma Gandhi Cancer Hospital", city: "Belagavi / Belgaum", state: "Karnataka", pincode: "590001", rating: 4.3, reviews: 210, type: "Cancer Hospital", lat: 15.8512, lng: 74.4931, phone: "+91 831 242 3333", facilities: ["Chemo Day Care", "Palliative Care", "Pharmacy"], services: S(["onco", "chemo", "ct", "blood", "opd", "ultrasound"], 1.0), about: "Cancer diagnosis, chemotherapy and palliative care centre." },
];

const DOC_SPEC: Record<string, [string, string][]> = {
  "sankeshwar-mission": [["Dr. Anand Kulkarni", "General Physician"], ["Dr. Savita Hiremath", "Gynecologist"]],
  shidalali: [["Dr. Mahesh Shidalali", "Cardiologist"], ["Dr. Priya Desai", "Nephrologist"]],
  vivekananda: [["Dr. Suresh Patil", "Orthopedic Surgeon"], ["Dr. Kavya Naik", "Cardiologist"]],
  rukmini: [["Dr. Rukmini Joshi", "Gynecologist"], ["Dr. Vinay Kamat", "Pediatrician"]],
  "patil-care": [["Dr. Rahul Patil", "General Physician"], ["Dr. Neha Patil", "Physiotherapist"]],
  "mm-joshi-eye": [["Dr. M. M. Joshi", "Ophthalmologist"], ["Dr. Shreya Joshi", "Cataract Specialist"]],
  "sbss-krishna": [["Dr. Gopal Bhat", "Ayurveda Physician"], ["Dr. Lakshmi Rao", "Panchakarma Specialist"]],
  banashankari: [["Dr. Prakash Magdum", "Dentist"], ["Dr. Asha Kore", "Pediatrician"]],
  apoorva: [["Dr. Sandeep Hegde", "Neurologist"], ["Dr. Pooja Shetty", "Radiologist"]],
  "kles-kore": [["Dr. Vivek Saoji", "Cardiothoracic Surgeon"], ["Dr. Meera Angadi", "Endocrinologist"]],
  "kle-cancer": [["Dr. Kumar Vinchurkar", "Oncologist"], ["Dr. Deepa Mudhol", "Radiation Oncologist"]],
  dakshata: [["Dr. Nitin Gangane", "General Surgeon"], ["Dr. Smita Jadhav", "Physician"]],
  "mg-cancer": [["Dr. Arvind Gandhi", "Medical Oncologist"], ["Dr. Rekha Pai", "Palliative Care"]],
};
const TIMINGS = ["Mon–Sat · 9:00 AM – 1:00 PM", "Mon–Fri · 4:00 PM – 8:00 PM", "Mon–Sat · 10:00 AM – 5:00 PM", "Tue–Sun · 9:00 AM – 2:00 PM"];

export const DOCTORS: Doctor[] = HOSPITALS.flatMap((h, hi) =>
  (DOC_SPEC[h.id] ?? []).map(([name, specialty], i) => ({
    id: `${h.id}-d${i}`, name, specialty, hospitalId: h.id,
    experience: 6 + ((hi * 7 + i * 5) % 20), timings: TIMINGS[(hi + i) % TIMINGS.length],
    fee: 300 + ((hi + i * 3) % 6) * 100,
  })),
);

export const ALL_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "16:00", "16:30", "17:00", "17:30"];

function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
/** Deterministic demo availability minus booked slots. */
export function slotsFor(doctorId: string, date: string, booked: string[]) {
  return ALL_SLOTS.filter((s) => hash(doctorId + date + s) % 3 !== 0 && !booked.includes(s));
}

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const KNOWN_PLACES: Record<string, { lat: number; lng: number; label: string }> = {
  sankeshwar: { lat: 16.2667, lng: 74.4833, label: "Sankeshwar, Karnataka" },
  "591313": { lat: 16.2667, lng: 74.4833, label: "Sankeshwar 591313" },
  belagavi: { lat: 15.8497, lng: 74.4977, label: "Belagavi, Karnataka" },
  belgaum: { lat: 15.8497, lng: 74.4977, label: "Belagavi, Karnataka" },
  tilakwadi: { lat: 15.8405, lng: 74.5068, label: "Tilakwadi, Belagavi" },
  "590001": { lat: 15.8497, lng: 74.4977, label: "Belagavi 590001" },
  hukkeri: { lat: 16.2306, lng: 74.6008, label: "Hukkeri, Karnataka" },
  gokak: { lat: 16.1667, lng: 74.8333, label: "Gokak, Karnataka" },
  nipani: { lat: 16.3997, lng: 74.3828, label: "Nipani, Karnataka" },
  kolhapur: { lat: 16.705, lng: 74.2433, label: "Kolhapur, Maharashtra" },
  hubli: { lat: 15.3647, lng: 75.124, label: "Hubballi, Karnataka" },
  dharwad: { lat: 15.4589, lng: 75.0078, label: "Dharwad, Karnataka" },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: "Bengaluru, Karnataka" },
  bangalore: { lat: 12.9716, lng: 77.5946, label: "Bengaluru, Karnataka" },
  mumbai: { lat: 19.076, lng: 72.8777, label: "Mumbai, Maharashtra" },
  pune: { lat: 18.5204, lng: 73.8567, label: "Pune, Maharashtra" },
  delhi: { lat: 28.6139, lng: 77.209, label: "New Delhi" },
  chennai: { lat: 13.0827, lng: 80.2707, label: "Chennai, Tamil Nadu" },
  hyderabad: { lat: 17.385, lng: 78.4867, label: "Hyderabad, Telangana" },
};

export async function geocode(q: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const key = q.trim().toLowerCase();
  if (!key) return null;
  const hit = Object.entries(KNOWN_PLACES).find(([k]) => key.includes(k));
  if (hit) return hit[1];
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`);
    const j = await r.json();
    if (j?.[0]) return { lat: +j[0].lat, lng: +j[0].lon, label: j[0].display_name.split(",").slice(0, 2).join(",") };
  } catch { /* offline */ }
  return null;
}

/** Simple ML-style regression: estimated wait time in minutes. */
export function predictWait(h: Hospital, hour = new Date().getHours()) {
  const peak = Math.exp(-((hour - 11) ** 2) / 8) * 30 + Math.exp(-((hour - 18) ** 2) / 6) * 18;
  const load = Math.log10(h.reviews + 10) * 6;
  const size = h.type.includes("Tertiary") ? 12 : h.type.includes("Multi") ? 6 : 0;
  return Math.max(5, Math.round(8 + peak + load + size - h.rating * 2));
}

const URGENT: Record<string, number> = { "chest pain": 40, breathless: 35, "breathing": 35, unconscious: 50, bleeding: 35, stroke: 50, seizure: 45, fracture: 25, "high fever": 20, fever: 10, vomiting: 10, headache: 6, cough: 5, cold: 3, rash: 5, pain: 8, dizzy: 15, pregnan: 20, burn: 30 };
export function triageScore(symptoms: string, age: number) {
  const s = symptoms.toLowerCase();
  let score = 10 + Object.entries(URGENT).reduce((a, [k, v]) => (s.includes(k) ? a + v : a), 0);
  if (age > 60 || age < 5) score += 12;
  score = Math.min(100, score);
  const level = score >= 60 ? "Emergency" : score >= 35 ? "Urgent" : score >= 20 ? "Soon" : "Routine";
  return { score, level };
}

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id)!;
