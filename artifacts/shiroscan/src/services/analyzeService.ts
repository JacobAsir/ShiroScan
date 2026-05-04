import { apiGet, apiPostFormData } from "@/lib/api";
import type {
  AnalysisResult,
  UserPreferences,
} from "@/types/analysis";

export interface AnalyzeRequestInput {
  image: File;
  preferences: UserPreferences;
}

export interface HealthResponse {
  status: string;
  processing_mode: "gemini" | "fallback";
  ocr_provider: string;
  llm_provider: string;
  version: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/health");
}

export async function analyzeImage(
  input: AnalyzeRequestInput,
): Promise<AnalysisResult> {
  const fd = new FormData();
  fd.append("image", input.image);
  fd.append("preferences", JSON.stringify(input.preferences));
  return apiPostFormData<AnalysisResult>("/analyze", fd);
}
