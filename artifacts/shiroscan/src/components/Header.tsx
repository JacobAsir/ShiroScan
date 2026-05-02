import { Link } from "wouter";
import { usePreferences } from "@/hooks/usePreferences";
import { pickLang, UI_COPY } from "@/lib/constants";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShieldAlert } from "lucide-react";

export function Header() {
  const { preferences, setLanguage } = usePreferences();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-md mx-auto items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <span className="flex flex-col -gap-1">
            <span className="leading-none text-foreground">{UI_COPY.appName.en}</span>
            <span className="text-[10px] leading-none text-muted-foreground">{UI_COPY.appName.ja}</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {pickLang({ en: "About", ja: "概要" }, preferences.language)}
          </Link>
          <ToggleGroup
            type="single"
            value={preferences.language}
            onValueChange={(val) => {
              if (val === "en" || val === "ja") setLanguage(val);
            }}
            className="border rounded-md h-8 overflow-hidden"
          >
            <ToggleGroupItem value="en" className="h-full px-3 rounded-none text-xs font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              EN
            </ToggleGroupItem>
            <ToggleGroupItem value="ja" className="h-full px-3 rounded-none text-xs font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              JA
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </header>
  );
}
