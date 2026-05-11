import { usePreferences } from "@/hooks/usePreferences";
import { pickLang, STATUS_LABELS, ALLERGEN_OPTIONS, DIETARY_OPTIONS } from "@/lib/constants";
import type { AnalysisResult } from "@/types/analysis";
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResultPanelProps {
  result: AnalysisResult;
}

const CATEGORY_COLORS: Record<string, string> = {
  allergen: "text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800",
  caution: "text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-800",
  diet_conflict: "text-yellow-700 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800",
  ingredient: "text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800",
  additive: "text-purple-700 bg-purple-100 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800",
  spice: "text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800",
  stock: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800",
};

export function ResultPanel({ result }: ResultPanelProps) {
  const { preferences } = usePreferences();
  const l = preferences.language;

  const StatusIcon = {
    safe: ShieldCheck,
    caution: AlertTriangle,
    avoid: ShieldAlert,
    info: Info,
  }[result.status];

  const statusColor = {
    safe: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    caution: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
    avoid: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    info: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  }[result.status];

  const statusLabel = pickLang(STATUS_LABELS[result.status], l);

  const getAllergenName = (key: string) => {
    if (key.startsWith("custom:")) return key.slice(7);
    const opt = ALLERGEN_OPTIONS.find(o => o.key === key);
    return opt ? pickLang(opt.label, l) : key;
  };

  const getDietaryName = (key: string) => {
    if (key.startsWith("custom:")) return key.slice(7);
    const opt = DIETARY_OPTIONS.find(o => o.key === key);
    return opt ? pickLang(opt.label, l) : key;
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500 p-1">
        {/* Status Badge */}
        <div className={`flex items-center gap-4 p-5 rounded-2xl border ${statusColor} transition-colors`}>
          <StatusIcon className="w-12 h-12 shrink-0 animate-in zoom-in duration-500" />
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight">{statusLabel}</h2>
            <p className="text-sm opacity-80 font-medium truncate">
              {result.product_name || pickLang({ en: "Unknown Product", ja: "不明な製品" }, l)}
            </p>
          </div>
        </div>

        {/* Bilingual Summary */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">English</h3>
              <p className="text-sm text-foreground leading-relaxed">{result.summary_en}</p>
            </div>
            <div className="h-px bg-border w-full"></div>
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">日本語</h3>
              <p className="text-sm text-foreground leading-relaxed">{result.summary_ja}</p>
            </div>
          </CardContent>
        </Card>

        {/* Conflicts */}
        {(result.matched_allergens.length > 0 || result.matched_diet_conflicts.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              {pickLang({ en: "Conflicts Detected", ja: "競合が検出されました" }, l)}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {result.matched_allergens.map(a => (
                <Badge key={a} variant="destructive" className="text-xs py-0.5 px-2.5">
                  {getAllergenName(a)}
                </Badge>
              ))}
              {result.matched_diet_conflicts.map(d => (
                <Badge key={d} variant="destructive" className="text-xs py-0.5 px-2.5">
                  {getDietaryName(d)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold">
            {pickLang({ en: "Evidence from Label", ja: "ラベルからの証拠" }, l)}
          </h3>
          {result.evidence.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {pickLang({ en: "No specific ingredients flagged.", ja: "特筆すべき成分は検出されませんでした。" }, l)}
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                result.evidence.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {} as Record<string, typeof result.evidence>)
              ).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[category] || "text-slate-700 bg-slate-100 border-slate-200"}`}>
                      {category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex flex-col p-3 rounded-xl border bg-card shadow-sm">
                        <span className="text-sm font-bold text-foreground tracking-wide mb-0.5">
                          {l === "en" ? item.normalized_meaning : item.japanese_text}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ArrowLeft className="w-2.5 h-2.5 inline rotate-180 shrink-0" />
                          <span className="truncate">
                            {l === "en" ? item.japanese_text : item.normalized_meaning}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keywords */}
        {result.extracted_keywords.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {pickLang({ en: "Other notable ingredients", ja: "その他の注目成分" }, l)}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {result.extracted_keywords.map((kw, i) => (
                <Badge key={i} variant="outline" className="bg-muted/30 text-xs">{kw}</Badge>
              ))}
            </div>
          </div>
        )}


        {/* Raw OCR */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="ocr" className="border-none">
            <AccordionTrigger className="text-xs font-semibold text-muted-foreground hover:text-foreground py-2">
              {pickLang({ en: "View Raw Text (OCR)", ja: "元のテキスト（OCR）" }, l)}
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted/50 p-3 rounded-xl border font-mono text-[10px] text-muted-foreground whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
                {result.raw_ocr_text || pickLang({ en: "No raw text available.", ja: "テキストデータがありません。" }, l)}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  );
}
