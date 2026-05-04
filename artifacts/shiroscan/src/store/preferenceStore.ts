import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AllergenKey,
  DietaryKey,
  UILanguage,
  UserPreferences,
} from "@/types/analysis";

interface PreferenceState {
  preferences: UserPreferences;
  toggleAllergy: (key: AllergenKey) => void;
  toggleDietary: (key: DietaryKey) => void;
  addCustomAllergy: (term: string) => void;
  removeCustomAllergy: (term: string) => void;
  addCustomDietary: (term: string) => void;
  removeCustomDietary: (term: string) => void;
  setLanguage: (language: UILanguage) => void;
  reset: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  allergies: [],
  dietary: [],
  custom_allergies: [],
  custom_dietary: [],
  language: "en",
};

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,

      toggleAllergy: (key) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            allergies: state.preferences.allergies.includes(key)
              ? state.preferences.allergies.filter((a) => a !== key)
              : [...state.preferences.allergies, key],
          },
        })),

      toggleDietary: (key) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            dietary: state.preferences.dietary.includes(key)
              ? state.preferences.dietary.filter((d) => d !== key)
              : [...state.preferences.dietary, key],
          },
        })),

      addCustomAllergy: (term) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        set((state) => ({
          preferences: {
            ...state.preferences,
            custom_allergies: state.preferences.custom_allergies.includes(trimmed)
              ? state.preferences.custom_allergies
              : [...state.preferences.custom_allergies, trimmed],
          },
        }));
      },

      removeCustomAllergy: (term) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            custom_allergies: state.preferences.custom_allergies.filter((t) => t !== term),
          },
        })),

      addCustomDietary: (term) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        set((state) => ({
          preferences: {
            ...state.preferences,
            custom_dietary: state.preferences.custom_dietary.includes(trimmed)
              ? state.preferences.custom_dietary
              : [...state.preferences.custom_dietary, trimmed],
          },
        }));
      },

      removeCustomDietary: (term) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            custom_dietary: state.preferences.custom_dietary.filter((t) => t !== term),
          },
        })),

      setLanguage: (language) =>
        set((state) => ({
          preferences: { ...state.preferences, language },
        })),

      reset: () => set({ preferences: DEFAULT_PREFERENCES }),
    }),
    {
      name: "shiroscan.preferences.v3",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
