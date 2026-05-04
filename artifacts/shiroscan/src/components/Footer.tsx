import { usePreferences } from "@/hooks/usePreferences";
import { pickLang, UI_COPY } from "@/lib/constants";

export function Footer() {
  const { preferences } = usePreferences();

  return (
    <footer className="border-t border-border mt-auto bg-muted/20">
      <div className="container max-w-screen-md mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <div className="text-xs">
          &copy; {new Date().getFullYear()} ShiroScan. Japan Utility.
        </div>
      </div>
    </footer>
  );
}
