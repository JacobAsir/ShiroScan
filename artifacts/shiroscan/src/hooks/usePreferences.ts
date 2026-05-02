import { useCallback, useEffect, useState } from "react";
import type {
  AllergenKey,
  DietaryKey,
  UILanguage,
  UserPreferences,
} from "@/types/analysis";

const STORAGE_KEY = "shiroscan.preferences.v1";

const DEFAULT_PREFERENCES: UserPreferences = {
  allergies: [],
  dietary: [],
  language: "en",
};

function loadInitial(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      allergies: Array.isArray(parsed.allergies) ? (parsed.allergies as AllergenKey[]) : [],
      dietary: Array.isArray(parsed.dietary) ? (parsed.dietary as DietaryKey[]) : [],
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
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // sessionStorage unavailable — fail silently, state still works in-memory
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
    setLanguage,
    reset,
  };
}
