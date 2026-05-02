export type AnalysisStatus = "safe" | "caution" | "avoid";

export type EvidenceCategory =
  | "allergen"
  | "caution"
  | "ingredient"
  | "diet_conflict";

export type ProcessingMode = "mock" | "gemini" | "fallback";

export type AllergenKey =
  | "egg"
  | "milk"
  | "wheat"
  | "shrimp"
  | "crab"
  | "peanuts"
  | "buckwheat"
  | "walnuts"
  | "soy"
  | "sesame";

export type DietaryKey =
  | "vegetarian"
  | "halal"
  | "no_pork"
  | "lactose_free";

export type UILanguage = "en" | "ja";

export interface UserPreferences {
  allergies: AllergenKey[];
  dietary: DietaryKey[];
  language: UILanguage;
}

export interface EvidenceItem {
  japanese_text: string;
  normalized_meaning: string;
  category: EvidenceCategory;
}

export interface AnalysisResult {
  product_name: string | null;
  status: AnalysisStatus;
  confidence_score: number;
  matched_allergens: AllergenKey[];
  matched_diet_conflicts: DietaryKey[];
  extracted_keywords: string[];
  evidence: EvidenceItem[];
  summary_ja: string;
  summary_en: string;
  raw_ocr_text: string;
  warnings: string[];
  processing_mode: ProcessingMode;
}

export interface DemoSample {
  id: string;
  product_name: string;
  description_en: string;
  description_ja: string;
  preview_text: string;
  thumbnail_emoji?: string;
}
