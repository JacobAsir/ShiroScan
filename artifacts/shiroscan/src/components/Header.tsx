import { Link } from "wouter";
import { usePreferences } from "@/hooks/usePreferences";
import { pickLang, UI_COPY } from "@/lib/constants";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShieldAlert, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { preferences, setLanguage } = usePreferences();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          {onMenuClick && (
            <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0" onClick={onMenuClick}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <Link 
            href="/" 
            className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span className="flex flex-col -gap-1">
              <span className="leading-none text-foreground">{UI_COPY.appName.en}</span>
              <span className="text-[10px] leading-none text-muted-foreground">{UI_COPY.appName.ja}</span>
            </span>
          </Link>
        </div>
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
