export type AnalysisStatus = "safe" | "caution" | "avoid" | "info";

export type EvidenceCategory =
  | "allergen"
  | "caution"
  | "ingredient"
  | "diet_conflict"
  | "additive"
  | "spice"
  | "stock";

export type ProcessingMode = "gemini" | "fallback";

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
  custom_allergies: string[];
  custom_dietary: string[];
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
  matched_allergens: string[];
  matched_diet_conflicts: string[];
  extracted_keywords: string[];
  evidence: EvidenceItem[];
  summary_ja: string;
  summary_en: string;
  raw_ocr_text: string;
  warnings: string[];
  processing_mode: ProcessingMode;
}

export interface ScanSession {
  id: string;
  timestamp: number;
  imageUrl: string;
  productName: string | null;
  status: AnalysisStatus;
  result: AnalysisResult;
}
