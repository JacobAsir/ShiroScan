import { createContext, useContext, useState, ReactNode } from "react";
import type { AnalysisResult } from "@/types/analysis";

interface ResultContextType {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
}

const ResultContext = createContext<ResultContextType | undefined>(undefined);

export function ResultProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  return (
    <ResultContext.Provider value={{ result, setResult }}>
      {children}
    </ResultContext.Provider>
  );
}

export function useResult() {
  const context = useContext(ResultContext);
  if (context === undefined) {
    throw new Error("useResult must be used within a ResultProvider");
  }
  return context;
}
