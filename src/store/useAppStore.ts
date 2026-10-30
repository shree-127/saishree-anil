import { create } from "zustand";
import { Category, DraftReport, Report, WitnessDetails } from "../types";

export type Language = "kn" | "en";
export type ThemeMode = "light" | "dark";

interface AppState {
  language: Language;
  theme: ThemeMode;
  draftReport: DraftReport;
  lastSubmittedReport: Report | null;
  reports: Report[];

  // Actions
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  updateDraft: (updates: Partial<DraftReport>) => void;
  updateWitness: (witnessUpdates: Partial<WitnessDetails>) => void;
  resetDraft: () => void;
  setLastSubmittedReport: (report: Report | null) => void;
  setReports: (reports: Report[]) => void;
}

const initialDraft: DraftReport = {
  lat: null,
  lng: null,
  address: "",
  addressKn: "",
  areaEn: "",
  areaKn: "",
  accuracyM: null,
  photoDataUrl: null,
  anonymous: true,
  witness: {},
};

// Retrieve persisted language preference, defaulting to Kannada 'kn'
const getStoredLanguage = (): Language => {
  try {
    const saved = localStorage.getItem("nr_lang");
    if (saved === "en" || saved === "kn") return saved;
  } catch {
    // fallback
  }
  return "kn";
};

// Retrieve persisted theme preference, defaulting to dark or light
const getStoredTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem("nr_theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // fallback
  }
  return "dark"; // Defaulting to dark creates a sleek emergency-ops aesthetic
};

export const useAppStore = create<AppState>((set, get) => ({
  language: getStoredLanguage(),
  theme: getStoredTheme(),
  draftReport: initialDraft,
  lastSubmittedReport: null,
  reports: [],

  setLanguage: (language: Language) => {
    try {
      localStorage.setItem("nr_lang", language);
    } catch {
      // ignore
    }
    set({ language });
  },

  toggleLanguage: () => {
    const next = get().language === "kn" ? "en" : "kn";
    get().setLanguage(next);
  },

  setTheme: (theme: ThemeMode) => {
    try {
      localStorage.setItem("nr_theme", theme);
    } catch {
      // ignore
    }
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  updateDraft: (updates: Partial<DraftReport>) => {
    set((state) => ({
      draftReport: {
        ...state.draftReport,
        ...updates,
      },
    }));
  },

  updateWitness: (witnessUpdates: Partial<WitnessDetails>) => {
    set((state) => ({
      draftReport: {
        ...state.draftReport,
        witness: {
          ...state.draftReport.witness,
          ...witnessUpdates,
        },
      },
    }));
  },

  resetDraft: () => {
    set({
      draftReport: {
        lat: null,
        lng: null,
        address: "",
        addressKn: "",
        areaEn: "",
        areaKn: "",
        accuracyM: null,
        photoDataUrl: null,
        anonymous: true,
        witness: {},
      },
    });
  },

  setLastSubmittedReport: (report: Report | null) => {
    set({ lastSubmittedReport: report });
  },

  setReports: (reports: Report[]) => {
    set({ reports });
  },
}));
