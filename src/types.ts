export type Category = "road_accident" | "fire" | "not_sure";

export type Status =
  | "reported"
  | "ai_analyzed"
  | "call_queued"
  | "call_delivered"
  | "call_failed"
  | "accepted"
  | "en_route"
  | "on_scene"
  | "resolved";

export type YesNoUnsure = "yes" | "no" | "unsure";

export interface WitnessDetails {
  bleeding?: YesNoUnsure;
  conscious?: YesNoUnsure;
  trapped?: YesNoUnsure;
  note?: string;
}

export interface Report {
  id: string;
  createdAt: string;
  lat: number;
  lng: number;
  address: string;
  addressKn: string;
  areaEn: string;
  areaKn: string;
  accuracyM: number;
  photoDataUrl?: string;
  category: Category;
  aiConfidence: "high" | "medium" | "low";
  aiSummaryEn: string;
  aiSummaryKn: string;
  needsReview: boolean;
  anonymous: boolean;
  witness: WitnessDetails;
  isDuplicate: boolean;
  duplicateOf?: string;
  callStatus: "queued" | "calling" | "delivered" | "failed";
  status: Status;
  responder?: {
    id: string;
    name: string;
    etaMin?: number;
  };
}

export interface Responder {
  id: string;
  orgName: string;
  type: "hospital" | "ambulance" | "fire" | "police";
  licenseNo: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  open24x7: boolean;
  verified: boolean;
}

export interface DraftReport {
  lat: number | null;
  lng: number | null;
  address: string;
  addressKn?: string;
  areaEn?: string;
  areaKn?: string;
  accuracyM: number | null;
  photoDataUrl: string | null;
  anonymous: boolean;
  category?: Category;
  aiConfidence?: "high" | "medium" | "low";
  aiSummaryEn?: string;
  aiSummaryKn?: string;
  needsReview?: boolean;
  witness: WitnessDetails;
}

export interface AiAnalysisResult {
  category: Category;
  confidence: "high" | "medium" | "low";
  summaryEn: string;
  summaryKn: string;
  needsReview: boolean;
  isDuplicate: boolean;
  duplicateOf?: string;
}
