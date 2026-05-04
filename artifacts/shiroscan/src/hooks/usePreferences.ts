import { usePreferenceStore } from "@/store/preferenceStore";

export function usePreferences() {
  const store = usePreferenceStore();
  
  return {
    preferences: store.preferences,
    toggleAllergy: store.toggleAllergy,
    toggleDietary: store.toggleDietary,
    addCustomAllergy: store.addCustomAllergy,
    removeCustomAllergy: store.removeCustomAllergy,
    addCustomDietary: store.addCustomDietary,
    removeCustomDietary: store.removeCustomDietary,
    setLanguage: store.setLanguage,
    reset: store.reset,
  };
}
