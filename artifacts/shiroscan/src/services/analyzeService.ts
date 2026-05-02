import { apiGet, apiPostFormData } from "@/lib/api";
import type {
  AnalysisResult,
  DemoSample,
  UserPreferences,
} from "@/types/analysis";

export interface AnalyzeRequestInput {
  image: File;
  preferences: UserPreferences;
}

export interface DemoAnalyzeRequestInput {
  sampleId: string;
  preferences: UserPreferences;
}

export interface HealthResponse {
  status: string;
  processing_mode: "mock" | "gemini" | "fallback";
  ocr_provider: string;
  llm_provider: string;
  version: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/health");
}

export async function fetchDemoSamples(): Promise<DemoSample[]> {
  return apiGet<DemoSample[]>("/demo-samples");
}

export async function analyzeImage(
  input: AnalyzeRequestInput,
): Promise<AnalysisResult> {
  const fd = new FormData();
  fd.append("image", input.image);
  fd.append("preferences", JSON.stringify(input.preferences));
  return apiPostFormData<AnalysisResult>("/analyze", fd);
}

export async function analyzeDemoSample(
  input: DemoAnalyzeRequestInput,
): Promise<AnalysisResult> {
  const fd = new FormData();
  fd.append("sample_id", input.sampleId);
  fd.append("preferences", JSON.stringify(input.preferences));
  return apiPostFormData<AnalysisResult>("/analyze-demo", fd);
}
