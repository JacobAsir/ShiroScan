import { usePreferences } from "@/hooks/usePreferences";
import { pickLang, UI_COPY } from "@/lib/constants";

export function Footer() {
  const { preferences } = usePreferences();

  return (
    <footer className="border-t border-border mt-auto bg-muted/20">
      <div className="container max-w-screen-md mx-auto px-4 py-8 text-center text-sm text-muted-foreground space-y-4">
        <p className="max-w-md mx-auto">{pickLang(UI_COPY.disclaimer, preferences.language)}</p>
        <p className="max-w-md mx-auto">{pickLang(UI_COPY.privacy, preferences.language)}</p>
        <div className="text-xs pt-4 border-t border-border/50">
          &copy; {new Date().getFullYear()} ShiroScan. Japan Utility.
        </div>
      </div>
    </footer>
  );
}
