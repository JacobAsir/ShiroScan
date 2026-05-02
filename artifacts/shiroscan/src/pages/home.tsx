import { Link } from "wouter";
import { usePreferences } from "@/hooks/usePreferences";
import { pickLang, UI_COPY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Camera, ShieldCheck, Languages, Search, AlertCircle } from "lucide-react";

export default function Home() {
  const { preferences } = usePreferences();
  const l = preferences.language;

  return (
    <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 w-full">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground balance">
          {pickLang({ en: "Scan Japanese food labels. Eat safely.", ja: "日本の食品ラベルをスキャン。安全に食べる。" }, l)}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto balance">
          {pickLang(UI_COPY.tagline, l)}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/scan" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-base h-14 px-8 font-semibold rounded-xl">
              <Camera className="w-5 h-5 mr-2" />
              {pickLang(UI_COPY.cta, l)}
            </Button>
          </Link>
        </div>
      </section>

      {/* Trust & Process Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl pt-12 border-t border-border">
        <div className="flex flex-col items-center text-center space-y-3 p-4 bg-card rounded-2xl border shadow-sm">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">
            {pickLang({ en: "Set Preferences", ja: "設定を保存" }, l)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {pickLang({ en: "Select your allergies and dietary needs.", ja: "アレルギーや食事制限を選択します。" }, l)}
          </p>
        </div>

        <div className="flex flex-col items-center text-center space-y-3 p-4 bg-card rounded-2xl border shadow-sm">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Search className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">
            {pickLang({ en: "Snap a Photo", ja: "写真を撮る" }, l)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {pickLang({ en: "Scan the ingredients list on any package.", ja: "パッケージの原材料表をスキャンします。" }, l)}
          </p>
        </div>

        <div className="flex flex-col items-center text-center space-y-3 p-4 bg-card rounded-2xl border shadow-sm">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Languages className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">
            {pickLang({ en: "Get Clear Results", ja: "結果を確認" }, l)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {pickLang({ en: "Bilingual explanation with highlighted evidence.", ja: "バイリンガルの解説と証拠のハイライト。" }, l)}
          </p>
        </div>
      </section>
    </div>
  );
}
