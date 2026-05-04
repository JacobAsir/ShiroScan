import { usePreferences } from "@/hooks/usePreferences";
import { useSessionStore } from "@/store/sessionStore";
import { pickLang } from "@/lib/constants";
import type { ScanSession } from "@/types/analysis";
import { Plus, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const STATUS_DOTS: Record<string, string> = {
  safe: "bg-green-500",
  caution: "bg-yellow-500",
  avoid: "bg-red-500",
  info: "bg-blue-500",
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface SidebarProps {
  onNewScan: () => void;
  className?: string;
}

export function Sidebar({ onNewScan, className = "" }: SidebarProps) {
  const { preferences } = usePreferences();
  const l = preferences.language;
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const clearSessions = useSessionStore((s) => s.clearSessions);

  return (
    <div className={`flex flex-col h-full bg-muted/30 ${className}`}>
      {/* New Scan Button */}
      <div className="p-3">
        <Button
          onClick={onNewScan}
          className="w-full rounded-xl font-semibold"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {pickLang({ en: "New Scan", ja: "新しいスキャン" }, l)}
        </Button>
      </div>

      <Separator />

      {/* Session List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
              {pickLang({ en: "No scans yet", ja: "スキャン履歴なし" }, l)}
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all text-sm group ${
                  activeSessionId === session.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/60 border border-transparent"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0 border">
                  <img
                    src={session.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs truncate text-foreground">
                    {session.productName || pickLang({ en: "Unknown", ja: "不明" }, l)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[session.status] || STATUS_DOTS.info}`} />
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {session.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      · {timeAgo(session.timestamp)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {sessions.length > 0 && (
        <>
          <Separator />
          <div className="p-3 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {sessions.length} {pickLang({ en: "scan(s)", ja: "件" }, l)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSessions}
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {pickLang({ en: "Clear", ja: "消去" }, l)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
