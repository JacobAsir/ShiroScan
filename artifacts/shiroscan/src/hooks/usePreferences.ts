import { useCallback, useEffect, useState } from "react";
import type {
  AllergenKey,
  DietaryKey,
  UILanguage,
  UserPreferences,
} from "@/types/analysis";

const STORAGE_KEY = "shiroscan.preferences.v2";

const DEFAULT_PREFERENCES: UserPreferences = {
  allergies: [],
  dietary: [],
  custom_allergies: [],
  custom_dietary: [],
  language: "en",
};

function loadInitial(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      allergies: Array.isArray(parsed.allergies) ? (parsed.allergies as AllergenKey[]) : [],
      dietary: Array.isArray(parsed.dietary) ? (parsed.dietary as DietaryKey[]) : [],
      custom_allergies: Array.isArray(parsed.custom_allergies) ? parsed.custom_allergies : [],
      custom_dietary: Array.isArray(parsed.custom_dietary) ? parsed.custom_dietary : [],
      language: parsed.language === "ja" ? "ja" : "en",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadInitial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // localStorage unavailable — fail silently
    }
  }, [preferences]);

  const toggleAllergy = useCallback((key: AllergenKey) => {
    setPreferences((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(key)
        ? prev.allergies.filter((a) => a !== key)
        : [...prev.allergies, key],
    }));
  }, []);

  const toggleDietary = useCallback((key: DietaryKey) => {
    setPreferences((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(key)
        ? prev.dietary.filter((d) => d !== key)
        : [...prev.dietary, key],
    }));
  }, []);

  const addCustomAllergy = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setPreferences((prev) => ({
      ...prev,
      custom_allergies: prev.custom_allergies.includes(trimmed)
        ? prev.custom_allergies
        : [...prev.custom_allergies, trimmed],
    }));
  }, []);

  const removeCustomAllergy = useCallback((term: string) => {
    setPreferences((prev) => ({
      ...prev,
      custom_allergies: prev.custom_allergies.filter((t) => t !== term),
    }));
  }, []);

  const addCustomDietary = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setPreferences((prev) => ({
      ...prev,
      custom_dietary: prev.custom_dietary.includes(trimmed)
        ? prev.custom_dietary
        : [...prev.custom_dietary, trimmed],
    }));
  }, []);

  const removeCustomDietary = useCallback((term: string) => {
    setPreferences((prev) => ({
      ...prev,
      custom_dietary: prev.custom_dietary.filter((t) => t !== term),
    }));
  }, []);

  const setLanguage = useCallback((language: UILanguage) => {
    setPreferences((prev) => ({ ...prev, language }));
  }, []);

  const reset = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    setPreferences,
    toggleAllergy,
    toggleDietary,
    addCustomAllergy,
    removeCustomAllergy,
    addCustomDietary,
    removeCustomDietary,
    setLanguage,
    reset,
  };
}
