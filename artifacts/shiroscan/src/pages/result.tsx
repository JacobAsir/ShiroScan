import { useLocation } from "wouter";
import { useResult } from "@/contexts/ResultContext";
import { usePreferences } from "@/hooks/usePreferences";
import { pickLang, STATUS_LABELS, ALLERGEN_OPTIONS, DIETARY_OPTIONS } from "@/lib/constants";
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowLeft, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useEffect } from "react";

export default function Result() {
  const { result } = useResult();
  const [, setLocation] = useLocation();
  const { preferences } = usePreferences();
  const l = preferences.language;

  useEffect(() => {
    if (!result) {
      setLocation("/scan");
    }
  }, [result, setLocation]);

  if (!result) return null;

  const StatusIcon = {
    safe: ShieldCheck,
    caution: Info,
    avoid: AlertTriangle,
  }[result.status];

  const statusColor = {
    safe: "text-green-600 bg-green-100 dark:bg-green-900/30",
    caution: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
    avoid: "text-destructive bg-destructive/10",
  }[result.status];

  const statusLabel = pickLang(STATUS_LABELS[result.status], l);

  const getAllergenName = (key: string) => {
    const opt = ALLERGEN_OPTIONS.find(o => o.key === key);
    return opt ? pickLang(opt.label, l) : key;
  };

  const getDietaryName = (key: string) => {
    const opt = DIETARY_OPTIONS.find(o => o.key === key);
    return opt ? pickLang(opt.label, l) : key;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <Button variant="ghost" size="sm" onClick={() => setLocation("/scan")} className="mb-2 -ml-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {pickLang({ en: "Back to Scan", ja: "スキャンに戻る" }, l)}
      </Button>

      {/* Main Status Badge */}
      <div className={`flex flex-col items-center justify-center p-8 rounded-3xl ${statusColor} transition-colors border shadow-sm`}>
        <StatusIcon className="w-20 h-20 mb-4 animate-in zoom-in duration-500 delay-150" />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
          {statusLabel}
        </h1>
        <p className="text-lg opacity-90 font-medium text-center">
          {result.product_name || pickLang({ en: "Unknown Product", ja: "不明な製品" }, l)}
        </p>
        {result.processing_mode !== "gemini" && (
          <Badge variant="outline" className="mt-4 bg-background/50 backdrop-blur">
            Mode: {result.processing_mode}
          </Badge>
        )}
      </div>

      {/* Bilingual Summary */}
      <Card className="border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">English Summary</h3>
            <p className="text-base text-foreground leading-relaxed">{result.summary_en}</p>
          </div>
          <div className="h-px bg-border w-full"></div>
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">日本語の要約</h3>
            <p className="text-base text-foreground leading-relaxed font-sans">{result.summary_ja}</p>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts & Matches */}
      {(result.matched_allergens.length > 0 || result.matched_diet_conflicts.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
            {pickLang({ en: "Conflicts Detected", ja: "競合が検出されました" }, l)}
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.matched_allergens.map(a => (
              <Badge key={a} variant="destructive" className="text-base py-1 px-4 shadow-sm">
                {getAllergenName(a)}
              </Badge>
            ))}
            {result.matched_diet_conflicts.map(d => (
              <Badge key={d} variant="destructive" className="text-base py-1 px-4 shadow-sm">
                {getDietaryName(d)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Evidence */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold">
          {pickLang({ en: "Evidence from Label", ja: "ラベルからの証拠" }, l)}
        </h2>
        {result.evidence.length === 0 ? (
          <p className="text-muted-foreground italic">
            {pickLang({ en: "No specific ingredients flagged.", ja: "特筆すべき成分は検出されませんでした。" }, l)}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.evidence.map((item, idx) => (
              <div key={idx} className="flex flex-col p-4 rounded-xl border bg-card shadow-sm">
                <span className="text-lg font-bold text-foreground font-sans tracking-widest mb-1">
                  {item.japanese_text}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3 inline rotate-180" /> {item.normalized_meaning}
                </span>
                <Badge variant="secondary" className="w-fit mt-2 text-[10px] uppercase">
                  {item.category}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extracted Keywords Summary */}
      {result.extracted_keywords.length > 0 && (
         <div className="space-y-3 pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
               {pickLang({ en: "Other notable ingredients", ja: "その他の注目成分" }, l)}
            </h3>
            <div className="flex flex-wrap gap-2">
               {result.extracted_keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="bg-muted/30">{kw}</Badge>
               ))}
            </div>
         </div>
      )}


      {/* Raw OCR Data */}
      <Accordion type="single" collapsible className="w-full pt-8">
        <AccordionItem value="ocr">
          <AccordionTrigger className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            {pickLang({ en: "View Raw Text Data (OCR)", ja: "元のテキストデータ（OCR）を表示" }, l)}
          </AccordionTrigger>
          <AccordionContent>
            <div className="bg-muted/50 p-4 rounded-xl border font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
              {result.raw_ocr_text || pickLang({ en: "No raw text available.", ja: "テキストデータがありません。" }, l)}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

    </div>
  );
}
