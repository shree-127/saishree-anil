import {
  AiAnalysisResult,
  Category,
  DraftReport,
  Report,
  Responder,
  Status,
} from "../types";
import { calculateDistanceMeters, generateIncidentId } from "./geo";

// Simulated latency helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Realistic seeded responders across Bengaluru
const INITIAL_RESPONDERS: Responder[] = [
  {
    id: "RESP-001",
    orgName: "Victoria Hospital Trauma Center",
    type: "hospital",
    licenseNo: "KA-MED-9941",
    contactPerson: "Dr. R. Chandrashekar",
    phone: "080-26701150",
    email: "emergency@victoriahospital.kar.nic.in",
    address: "Fort Road, near City Market, Bengaluru 560002",
    lat: 12.9634,
    lng: 77.5755,
    open24x7: true,
    verified: true,
  },
  {
    id: "RESP-002",
    orgName: "Manipal Hospital Old Airport Road",
    type: "hospital",
    licenseNo: "KA-MED-4421",
    contactPerson: "Dr. Ananya Rao",
    phone: "080-25024444",
    email: "er@manipalhospitals.com",
    address: "98, HAL Old Airport Rd, Kodihalli, Bengaluru 560017",
    lat: 12.9592,
    lng: 77.6475,
    open24x7: true,
    verified: true,
  },
  {
    id: "RESP-003",
    orgName: "108 Arogya Kavacha Fast Response Unit #42",
    type: "ambulance",
    licenseNo: "KA-AMB-8831",
    contactPerson: "Suresh Gowda (Paramedic Lead)",
    phone: "9845012345",
    email: "dispatch.east@gvkemri.org",
    address: "St. John's Hospital Base, Koramangala",
    lat: 12.9329,
    lng: 77.6225,
    open24x7: true,
    verified: true,
  },
  {
    id: "RESP-004",
    orgName: "Karnataka State Fire & Emergency Services Station - Hebbal",
    type: "fire",
    licenseNo: "KA-FIRE-007",
    contactPerson: "Station Officer K. Patil",
    phone: "080-22971500",
    email: "hebbal.fire@karnataka.gov.in",
    address: "Bellary Road, Hebbal, Bengaluru 560024",
    lat: 13.0381,
    lng: 77.5912,
    open24x7: true,
    verified: true,
  },
];

// Seeded realistic incidents across Bengaluru with 2 duplicate pairs
const INITIAL_REPORTS: Report[] = [
  {
    id: "NR-2026-1042",
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    lat: 12.9176,
    lng: 77.6238,
    address: "Silk Board Junction, Outer Ring Road flyover descent, Bengaluru",
    addressKn: "ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಜಂಕ್ಷನ್, ಔಟರ್ ರಿಂಗ್ ರೋಡ್ ಮೇಲ್ಸೇತುವೆ ಇಳಿಜಾರು, ಬೆಂಗಳೂರು",
    areaEn: "Silk Board",
    areaKn: "ಸಿಲ್ಕ್ ಬೋರ್ಡ್",
    accuracyM: 6,
    category: "road_accident",
    aiConfidence: "high",
    aiSummaryEn: "Two-wheeler collision with private cab. Rider down on leftmost lane.",
    aiSummaryKn: "ದ್ವಿಚಕ್ರ ವಾಹನ ಮತ್ತು ಕ್ಯಾಬ್ ಡಿಕ್ಕಿ. ಎಡಪಥದಲ್ಲಿ ಸವಾರ ಬಿದ್ದಿದ್ದಾರೆ.",
    needsReview: false,
    anonymous: true,
    witness: { bleeding: "yes", conscious: "yes", trapped: "no", note: "Near traffic police booth" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "accepted",
    responder: { id: "RESP-003", name: "108 Arogya Kavacha #42", etaMin: 4 },
  },
  {
    id: "NR-2026-1043",
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    lat: 12.9179,
    lng: 77.6235,
    address: "Silk Board Junction, Hosur Road entry ramp, Bengaluru",
    addressKn: "ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಜಂಕ್ಷನ್, ಹೊಸೂರು ರಸ್ತೆ ಪ್ರವೇಶ ರ್ಯಾಂಪ್, ಬೆಂಗಳೂರು",
    areaEn: "Silk Board",
    areaKn: "ಸಿಲ್ಕ್ ಬೋರ್ಡ್",
    accuracyM: 8,
    category: "road_accident",
    aiConfidence: "high",
    aiSummaryEn: "Motorcycle accident near flyover ramp. Crowd gathered.",
    aiSummaryKn: "ಮೇಲ್ಸೇತುವೆ ರ್ಯಾಂಪ್ ಬಳಿ ಬೈಕ್ ಅಪಘಾತ. ಸಾರ್ವಜನಿಕರು ನೆರೆದಿದ್ದಾರೆ.",
    needsReview: true,
    anonymous: true,
    witness: { conscious: "yes" },
    isDuplicate: true,
    duplicateOf: "NR-2026-1042",
    callStatus: "queued",
    status: "reported",
  },
  {
    id: "NR-2026-2101",
    createdAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    lat: 13.0358,
    lng: 77.597,
    address: "Hebbal Flyover, towards Kempegowda International Airport road",
    addressKn: "ಹೆಬ್ಬಾಳ ಮೇಲ್ಸೇತುವೆ, ಕೆಂಪೇಗೌಡ ಅಂತಾರಾಷ್ಟ್ರೀಯ ವಿಮಾನ ನಿಲ್ದಾಣ ರಸ್ತೆಯ ಕಡೆಗೆ",
    areaEn: "Hebbal Flyover",
    areaKn: "ಹೆಬ್ಬಾಳ ಫ್ಲೈಓವರ್",
    accuracyM: 10,
    category: "road_accident",
    aiConfidence: "high",
    aiSummaryEn: "Overturned light commercial vehicle blocking center lane.",
    aiSummaryKn: "ಮಧ್ಯದ ಪಥದಲ್ಲಿ ಸರಕು ವಾಹನ ಪಲ್ಟಿಯಾಗಿದೆ.",
    needsReview: false,
    anonymous: false,
    witness: { bleeding: "no", conscious: "yes", trapped: "no" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "en_route",
    responder: { id: "RESP-004", name: "Hebbal Traffic Police & Towing Unit", etaMin: 6 },
  },
  {
    id: "NR-2026-3390",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    lat: 12.9562,
    lng: 77.7011,
    address: "Marathahalli Bridge, near multiplex signal, Outer Ring Road",
    addressKn: "ಮಾರತ್ತಹಳ್ಳಿ ಸೇತುವೆ, ಮಲ್ಟಿಪ್ಲೆಕ್ಸ್ ಸಿಗ್ನಲ್ ಹತ್ತಿರ, ಔಟರ್ ರಿಂಗ್ ರೋಡ್",
    areaEn: "Marathahalli",
    areaKn: "ಮಾರತ್ತಹಳ್ಳಿ",
    accuracyM: 12,
    category: "fire",
    aiConfidence: "high",
    aiSummaryEn: "Electrical transformer spark with dense black smoke spreading.",
    aiSummaryKn: "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ನಲ್ಲಿ ಕಿಡಿ ಹೊತ್ತಿಕೊಂಡು ದಟ್ಟ ಹೊಗೆ ಆವರಿಸುತ್ತಿದೆ.",
    needsReview: false,
    anonymous: true,
    witness: { trapped: "no", note: "BESCOM sub-station nearby informed" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "on_scene",
    responder: { id: "RESP-004", name: "Fire & Rescue Tender Unit #12", etaMin: 1 },
  },
  {
    id: "NR-2026-4412",
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    lat: 13.0006,
    lng: 77.6974,
    address: "KR Puram Cable-Stayed Hanging Bridge, toward Tin Factory",
    addressKn: "ಕೆ.ಆರ್. ಪುರಂ ತೂಗು ಸೇತುವೆ, ಟಿನ್ ಫ್ಯಾಕ್ಟರಿ ಕಡೆಗೆ",
    areaEn: "KR Puram",
    areaKn: "ಕೆ.ಆರ್. ಪುರಂ",
    accuracyM: 9,
    category: "road_accident",
    aiConfidence: "medium",
    aiSummaryEn: "Auto rickshaw rear-ended by BMTC bus. Moderate front damage.",
    aiSummaryKn: "ಬಿಎಂಟಿಸಿ ಬಸ್ ಆಟೋಗೆ ಹಿಂಬದಿಯಿಂದ ಡಿಕ್ಕಿ. ಆಟೋ ಜಖಂಗೊಂಡಿದೆ.",
    needsReview: false,
    anonymous: true,
    witness: { bleeding: "yes", conscious: "yes", trapped: "unsure" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "accepted",
    responder: { id: "RESP-001", name: "Manipal North Emergency Unit", etaMin: 8 },
  },
  {
    id: "NR-2026-4415",
    createdAt: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
    lat: 13.0009,
    lng: 77.697,
    address: "KR Puram Hanging Bridge entry, Old Madras Road",
    addressKn: "ಕೆ.ಆರ್. ಪುರಂ ತೂಗು ಸೇತುವೆ ಪ್ರವೇಶ, ಹಳೆಯ ಮದ್ರಾಸ್ ರಸ್ತೆ",
    areaEn: "KR Puram",
    areaKn: "ಕೆ.ಆರ್. ಪುರಂ",
    accuracyM: 14,
    category: "road_accident",
    aiConfidence: "high",
    aiSummaryEn: "Auto accident under cable bridge. Traffic slowing down.",
    aiSummaryKn: "ಕೇಬಲ್ ಬ್ರಿಡ್ಜ್ ಬಳಿ ಆಟೋ ಅಪಘಾತ.",
    needsReview: true,
    anonymous: true,
    witness: {},
    isDuplicate: true,
    duplicateOf: "NR-2026-4412",
    callStatus: "queued",
    status: "reported",
  },
  {
    id: "NR-2026-5520",
    createdAt: new Date(Date.now() - 41 * 60 * 1000).toISOString(),
    lat: 12.8452,
    lng: 77.6602,
    address: "Electronic City Elevated Toll Plaza Phase 1, Hosur Road",
    addressKn: "ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ ಎಲಿವೇಟೆಡ್ ಟೋಲ್ ಪ್ಲಾಜಾ ಫೇಸ್ 1, ಹೊಸೂರು ರಸ್ತೆ",
    areaEn: "Electronic City",
    areaKn: "ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ",
    accuracyM: 5,
    category: "road_accident",
    aiConfidence: "high",
    aiSummaryEn: "Sedan side-scraped bridge divider. Airbags deployed.",
    aiSummaryKn: "ಕಾರು ಡಿವೈಡರ್‌ಗೆ ಡಿಕ್ಕಿ, ಏರ್‌ಬ್ಯಾಗ್ ತೆರೆದುಕೊಂಡಿದೆ.",
    needsReview: false,
    anonymous: false,
    witness: { bleeding: "no", conscious: "yes", trapped: "no" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "resolved",
    responder: { id: "RESP-003", name: "Narayana Hrudayalaya Ambulance", etaMin: 0 },
  },
  {
    id: "NR-2026-6631",
    createdAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    lat: 12.9772,
    lng: 77.5713,
    address: "Majestic City Railway Station Circle, Gubbi Thotadappa Road",
    addressKn: "ಮೆಜೆಸ್ಟಿಕ್ ಸಿಟಿ ರೈಲ್ವೆ ನಿಲ್ದಾಣ ಸರ್ಕಲ್, ಗುಬ್ಬಿ ತೋಟದಪ್ಪ ರಸ್ತೆ",
    areaEn: "Majestic",
    areaKn: "ಮೆಜೆಸ್ಟಿಕ್",
    accuracyM: 7,
    category: "not_sure",
    aiConfidence: "low",
    aiSummaryEn: "Unattended leaking drum on pedestrian walkway emitting chemical odor.",
    aiSummaryKn: "ಪಾದಚಾರಿ ಮಾರ್ಗದಲ್ಲಿ ಡ್ರಮ್‌ನಿಂದ ರಾಸಾಯನಿಕ ವಾಸನೆ ಮತ್ತು ದ್ರವ ಸೋರಿಕೆ.",
    needsReview: true,
    anonymous: true,
    witness: { trapped: "no", note: "Passersby feeling eye irritation" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "call_delivered",
  },
  {
    id: "NR-2026-7740",
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    lat: 12.9719,
    lng: 77.6412,
    address: "Indiranagar 100 Feet Road, near 12th Main junction",
    addressKn: "ಇಂದಿರಾನಗರ 100 ಅಡಿ ರಸ್ತೆ, 12ನೇ ಮುಖ್ಯರಸ್ತೆ ಜಂಕ್ಷನ್ ಹತ್ತಿರ",
    areaEn: "Indiranagar",
    areaKn: "ಇಂದಿರಾನಗರ",
    accuracyM: 4,
    category: "road_accident",
    aiConfidence: "high",
    aiSummaryEn: "Electric scooter skid on wet patch near metro pillar 88.",
    aiSummaryKn: "ಮೆಟ್ರೋ ಪಿಲ್ಲರ್ 88 ಬಳಿ ಜಾರಿದ ಎಲೆಕ್ಟ್ರಿಕ್ ಸ್ಕೂಟರ್.",
    needsReview: false,
    anonymous: true,
    witness: { bleeding: "yes", conscious: "yes", trapped: "no" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "resolved",
  },
  {
    id: "NR-2026-8851",
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    lat: 12.984,
    lng: 77.7523,
    address: "Whitefield Hope Farm Junction, towards ITPL Road",
    addressKn: "ವೈಟ್ಫೀಲ್ಡ್ ಹೋಪ್ ಫಾರ್ಮ್ ಜಂಕ್ಷನ್, ಐಟಿಪಿಎಲ್ ರಸ್ತೆಯ ಕಡೆಗೆ",
    areaEn: "Whitefield",
    areaKn: "ವೈಟ್ಫೀಲ್ಡ್",
    accuracyM: 11,
    category: "fire",
    aiConfidence: "high",
    aiSummaryEn: "Dry grass and timber waste blaze behind commercial complex.",
    aiSummaryKn: "ವಾಣಿಜ್ಯ ಸಂಕೀರ್ಣದ ಹಿಂಭಾಗದಲ್ಲಿ ಒಣಹುಲ್ಲು ಮತ್ತು ಮರದ ತ್ಯಾಜ್ಯಕ್ಕೆ ಬೆಂಕಿ.",
    needsReview: false,
    anonymous: true,
    witness: { trapped: "no" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "resolved",
  },
  {
    id: "NR-2026-9012",
    createdAt: new Date(Date.now() - 88 * 60 * 1000).toISOString(),
    lat: 12.9352,
    lng: 77.6245,
    address: "Koramangala 80 Feet Road, Sony World Signal",
    addressKn: "ಕೋರಮಂಗಲ 80 ಅಡಿ ರಸ್ತೆ, ಸೋನಿ ವರ್ಲ್ಡ್ ಸಿಗ್ನಲ್",
    areaEn: "Koramangala",
    areaKn: "ಕೋರಮಂಗಲ",
    accuracyM: 6,
    category: "road_accident",
    aiConfidence: "high",
    aiSummaryEn: "Car collision with delivery rider. Crowd rendering first aid.",
    aiSummaryKn: "ಡೆಲಿವರಿ ಬಾಯ್ ಬೈಕ್‌ಗೆ ಕಾರು ಡಿಕ್ಕಿ. ಸ್ಥಳೀಯರು ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ ನೀಡುತ್ತಿದ್ದಾರೆ.",
    needsReview: false,
    anonymous: false,
    witness: { bleeding: "yes", conscious: "yes", trapped: "no" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "resolved",
  },
  {
    id: "NR-2026-9320",
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    lat: 13.0238,
    lng: 77.5501,
    address: "Yeshwanthpur Railway Station Circle, Tumkur Road",
    addressKn: "ಯಶವಂತಪುರ ರೈಲ್ವೆ ನಿಲ್ದಾಣ ವೃತ್ತ, ತುಮಕೂರು ರಸ್ತೆ",
    areaEn: "Yeshwanthpur",
    areaKn: "ಯಶವಂತಪುರ",
    accuracyM: 15,
    category: "not_sure",
    aiConfidence: "medium",
    aiSummaryEn: "Fuel spill covering 30 meters of road surface causing skids.",
    aiSummaryKn: "ರಸ್ತೆಯ ಮೇಲೆ 30 ಮೀಟರ್ ಇಂಧನ ಸೋರಿಕೆ, ವಾಹನಗಳು ಜಾರುತ್ತಿವೆ.",
    needsReview: true,
    anonymous: true,
    witness: { bleeding: "no", conscious: "unsure" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "resolved",
  },
  {
    id: "NR-2026-9550",
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    lat: 12.9982,
    lng: 77.553,
    address: "Rajajinagar 1st Block, 10th Main Road, near ESI Hospital",
    addressKn: "ರಾಜಾಜಿನಗರ 1ನೇ ಬ್ಲಾಕ್, 10ನೇ ಮುಖ್ಯರಸ್ತೆ, ಇಎಸ್‌ಐ ಆಸ್ಪತ್ರೆ ಹತ್ತಿರ",
    areaEn: "Rajajinagar",
    areaKn: "ರಾಜಾಜಿನಗರ",
    accuracyM: 5,
    category: "fire",
    aiConfidence: "high",
    aiSummaryEn: "Domestic LPG cylinder kitchen flare-up contained to ground floor.",
    aiSummaryKn: "ಮನೆಯ ಅಡುಗೆ ಕೋಣೆಯಲ್ಲಿ ಅನಿಲ ಸಿಲಿಂಡರ್ ಬೆಂಕಿ.",
    needsReview: false,
    anonymous: true,
    witness: { trapped: "no", note: "Occupants evacuated outside safely" },
    isDuplicate: false,
    callStatus: "delivered",
    status: "resolved",
  },
];

// Single in-memory state shared across all API calls
let reportsDatabase: Report[] = [...INITIAL_REPORTS];
let respondersDatabase: Responder[] = [...INITIAL_RESPONDERS];

/**
 * Simulates Vision AI analysis of a captured photo & GPS location.
 */
export async function analyzePhoto(
  _photoDataUrl: string,
  location?: { lat: number; lng: number }
): Promise<AiAnalysisResult> {
  // Realistic simulated processing latency (1.8s)
  await delay(1800);

  // Check if near any existing active reports (< 300 meters) to detect duplicates
  let isDuplicate = false;
  let duplicateOf: string | undefined = undefined;

  if (location && location.lat && location.lng) {
    const nearby = reportsDatabase.find((rep) => {
      const distance = calculateDistanceMeters(
        location.lat,
        location.lng,
        rep.lat,
        rep.lng
      );
      return distance < 350;
    });

    if (nearby) {
      isDuplicate = true;
      duplicateOf = nearby.id;
    }
  }

  // Pre-configured classifications for realistic demo experience
  // By default, detect as road accident with high confidence, or alternate
  const sampleScenarios: Array<{
    category: Category;
    confidence: "high" | "medium" | "low";
    summaryEn: string;
    summaryKn: string;
    needsReview: boolean;
  }> = [
    {
      category: "road_accident",
      confidence: "high",
      summaryEn: "Traffic collision detected involving two-wheeler and vehicle. High impact damage visible.",
      summaryKn: "ದ್ವಿಚಕ್ರ ವಾಹನ ಮತ್ತು ಕಾರು ಡಿಕ್ಕಿಯಾಗಿದೆ. ಗಂಭೀರ ಹಾನಿ ಕಂಡುಬಂದಿದೆ.",
      needsReview: false,
    },
    {
      category: "fire",
      confidence: "high",
      summaryEn: "Open flames and dark smoke column detected. Rapid response fire tender recommended.",
      summaryKn: "ಬೆಂಕಿ ಮತ್ತು ದಟ್ಟ ಕಪ್ಪು ಹೊಗೆ ಕಾಣಿಸುತ್ತಿದೆ. ಅಗ್ನಿಶಾಮಕ ವಾಹನ ತಕ್ಷಣ ಅಗತ್ಯ.",
      needsReview: false,
    },
    {
      category: "not_sure",
      confidence: "medium",
      summaryEn: "Obstruction and crowd disturbance observed on roadway. Operator verification required.",
      summaryKn: "ರಸ್ತೆಯಲ್ಲಿ ಅಡಚಣೆ ಮತ್ತು ಸಾರ್ವಜನಿಕರ ಜಮಾವಣೆ. ಆಪರೇಟರ್ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ.",
      needsReview: true,
    },
  ];

  // Default to road_accident for typical demo, unless already duplicate
  const picked = sampleScenarios[0];

  return {
    category: picked.category,
    confidence: picked.confidence,
    summaryEn: picked.summaryEn,
    summaryKn: picked.summaryKn,
    needsReview: picked.needsReview,
    isDuplicate,
    duplicateOf,
  };
}

/**
 * Submits a new report and saves it into the shared memory store.
 */
export async function submitReport(draft: DraftReport): Promise<Report> {
  await delay(1200);

  const id = generateIncidentId();
  const lat = draft.lat ?? 12.9716;
  const lng = draft.lng ?? 77.5946;
  const address = draft.address || "Near Bengaluru Central, Karnataka";
  const addressKn =
    draft.addressKn ||
    (draft.address ? draft.address : "ಬೆಂಗಳೂರು ಕೇಂದ್ರದ ಹತ್ತಿರ, ಕರ್ನಾಟಕ");
  const areaEn = draft.areaEn || "Bengaluru Central";
  const areaKn = draft.areaKn || "ಬೆಂಗಳೂರು ಕೇಂದ್ರ";
  const accuracyM = draft.accuracyM ?? 8;
  const category: Category = draft.category ?? "road_accident";

  // Check proximity for duplicate
  const nearby = reportsDatabase.find((rep) => {
    const dist = calculateDistanceMeters(lat, lng, rep.lat, rep.lng);
    return dist < 300 && rep.id !== id;
  });

  const isDuplicate = !!nearby;
  const duplicateOf = nearby ? nearby.id : undefined;

  const newReport: Report = {
    id,
    createdAt: new Date().toISOString(),
    lat,
    lng,
    address,
    addressKn,
    areaEn,
    areaKn,
    accuracyM,
    photoDataUrl: draft.photoDataUrl || undefined,
    category,
    aiConfidence: draft.aiConfidence || "high",
    aiSummaryEn:
      draft.aiSummaryEn ||
      (category === "road_accident"
        ? "Two-vehicle traffic accident verified by citizen photo."
        : category === "fire"
        ? "Active fire and smoke reported."
        : "Hazard reported needing verification."),
    aiSummaryKn:
      draft.aiSummaryKn ||
      (category === "road_accident"
        ? "ನಾಗರಿಕ ಫೋಟೋ ಮೂಲಕ ದೃಢೀಕರಿಸಲಾದ ರಸ್ತೆ ಅಪಘಾತ."
        : category === "fire"
        ? "ಬೆಂಕಿ ಅವಘಡದ ವರದಿ."
        : "ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿರುವ ಘಟನೆ."),
    needsReview: draft.needsReview ?? (category === "not_sure"),
    anonymous: draft.anonymous,
    witness: draft.witness || {},
    isDuplicate,
    duplicateOf,
    callStatus: isDuplicate ? "queued" : "calling",
    status: "reported",
    responder: isDuplicate
      ? undefined
      : {
          id: "RESP-003",
          name: "108 Arogya Kavacha Bengaluru Dispatch",
          etaMin: 7,
        },
  };

  // Add to top of reports database
  reportsDatabase = [newReport, ...reportsDatabase];
  return newReport;
}

/**
 * Retrieves all stored incidents.
 */
export async function getReports(): Promise<Report[]> {
  await delay(300);
  return [...reportsDatabase];
}

/**
 * Retrieves a single report by ID.
 */
export async function getReport(id: string): Promise<Report | undefined> {
  await delay(250);
  return reportsDatabase.find((r) => r.id === id);
}

/**
 * Retrieves live non-resolved active reports for the feed.
 */
export async function getLiveReports(): Promise<Report[]> {
  await delay(300);
  return reportsDatabase.filter((r) => r.status !== "resolved");
}

/**
 * Registers a new responder in the shared registry.
 */
export async function registerResponder(
  data: Omit<Responder, "id" | "verified">
): Promise<Responder> {
  await delay(900);
  const newResponder: Responder = {
    ...data,
    id: `RESP-${Math.floor(100 + Math.random() * 900)}`,
    verified: false,
  };
  respondersDatabase = [newResponder, ...respondersDatabase];
  return newResponder;
}

/**
 * Gets incidents relevant to a given responder.
 */
export async function getResponderIncidents(
  responderId: string
): Promise<Report[]> {
  await delay(400);
  return reportsDatabase.filter(
    (r) => !r.responder || r.responder.id === responderId
  );
}

/**
 * Marks an incident as accepted by a responder.
 */
export async function acceptIncident(
  id: string,
  responderId: string
): Promise<Report> {
  await delay(500);
  const responder = respondersDatabase.find((resp) => resp.id === responderId);
  const index = reportsDatabase.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new Error(`Incident ${id} not found`);
  }

  const updated: Report = {
    ...reportsDatabase[index],
    status: "accepted",
    responder: {
      id: responderId,
      name: responder ? responder.orgName : "108 Arogya Kavacha Unit",
      etaMin: 6,
    },
  };

  reportsDatabase[index] = updated;
  return updated;
}

/**
 * Updates an incident's dispatch status.
 */
export async function updateIncidentStatus(
  id: string,
  status: Status
): Promise<Report> {
  await delay(400);
  const index = reportsDatabase.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error(`Incident ${id} not found`);
  }
  const updated: Report = {
    ...reportsDatabase[index],
    status,
  };
  reportsDatabase[index] = updated;
  return updated;
}

/**
 * Retries an automated voice call dispatch to responders.
 */
export async function retryCall(id: string): Promise<Report> {
  await delay(600);
  const index = reportsDatabase.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error(`Incident ${id} not found`);
  }
  const updated: Report = {
    ...reportsDatabase[index],
    callStatus: "delivered",
  };
  reportsDatabase[index] = updated;
  return updated;
}
