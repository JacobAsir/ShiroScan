import { create } from "zustand";
import type { AnalysisResult } from "@/types/analysis";

interface ResultState {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  clearResult: () => void;
}

export const useResultStore = create<ResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
