import { create } from "zustand";
import type { AnalysisResult, AnalysisStatus, ScanSession } from "@/types/analysis";

const MAX_SESSIONS = 20;

interface SessionState {
  sessions: ScanSession[];
  activeSessionId: string | null;
  addSession: (session: Omit<ScanSession, "id" | "timestamp">) => string;
  setActiveSession: (id: string | null) => void;
  getActiveSession: () => ScanSession | null;
  clearSessions: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSessionId: null,

  addSession: (data) => {
    const id = crypto.randomUUID();
    const session: ScanSession = {
      id,
      timestamp: Date.now(),
      ...data,
    };
    set((state) => ({
      sessions: [session, ...state.sessions].slice(0, MAX_SESSIONS),
      activeSessionId: id,
    }));
    return id;
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) ?? null;
  },

  clearSessions: () => set({ sessions: [], activeSessionId: null }),
}));
