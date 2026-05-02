import { usePreferences } from "@/hooks/usePreferences";
import { pickLang } from "@/lib/constants";
import { ShieldCheck, Search, Database, Lock, ShieldAlert } from "lucide-react";

export default function About() {
  const { preferences } = usePreferences();
  const l = preferences.language;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 py-8 max-w-2xl mx-auto">
      <div className="space-y-4 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {pickLang({ en: "About ShiroScan", ja: "ShiroScanについて" }, l)}
        </h1>
        <p className="text-lg text-muted-foreground">
          {pickLang({
            en: "An evidence-forward tool to help you navigate Japanese food labels with confidence.",
            ja: "日本の食品表示を安心して理解するための、証拠に基づいたツールです。"
          }, l)}
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">
          {pickLang({ en: "How it Works", ja: "仕組み" }, l)}
        </h2>
        
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-secondary shrink-0 flex items-center justify-center text-secondary-foreground font-bold">1</div>
            <div>
              <h3 className="font-semibold text-lg">{pickLang({ en: "Optical Character Recognition (OCR)", ja: "光学文字認識（OCR）" }, l)}</h3>
              <p className="text-muted-foreground mt-1">
                {pickLang({
                  en: "We process the uploaded image to extract all readable Japanese text from the ingredients list.",
                  ja: "アップロードされた画像を処理し、成分表から読み取り可能なすべての日本語テキストを抽出します。"
                }, l)}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-secondary shrink-0 flex items-center justify-center text-secondary-foreground font-bold">2</div>
            <div>
              <h3 className="font-semibold text-lg">{pickLang({ en: "Rule Engine & LLM Analysis", ja: "ルールエンジンとLLM分析" }, l)}</h3>
              <p className="text-muted-foreground mt-1">
                {pickLang({
                  en: "The extracted text is analyzed against your specific dietary profiles using advanced language models to identify direct matches and hidden aliases (e.g., matching 'casein' when you avoid 'milk').",
                  ja: "抽出されたテキストは、あなたの特定の食事プロフィールと照らし合わされ、直接の一致や隠れた別名（例：「乳」を避ける場合の「カゼイン」など）を特定します。"
                }, l)}
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-secondary shrink-0 flex items-center justify-center text-secondary-foreground font-bold">3</div>
            <div>
              <h3 className="font-semibold text-lg">{pickLang({ en: "Evidence Generation", ja: "証拠の生成" }, l)}</h3>
              <p className="text-muted-foreground mt-1">
                {pickLang({
                  en: "We never just give a 'safe' or 'unsafe' rating. Every claim is backed by the exact Japanese text found on the label, normalized for your understanding.",
                  ja: "単に「安全」か「危険」かを判定するだけではありません。すべての結果は、ラベルから見つかった正確な日本語テキストに裏付けられています。"
                }, l)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2 flex items-center gap-2">
          <Lock className="w-6 h-6 text-muted-foreground" />
          {pickLang({ en: "Privacy & Data", ja: "プライバシーとデータ" }, l)}
        </h2>
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <p className="text-foreground leading-relaxed">
            {pickLang({
              en: "Your privacy is critical. ShiroScan is a stateless utility.",
              ja: "あなたのプライバシーは重要です。ShiroScanはステートレスなユーティリティです。"
            }, l)}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>{pickLang({ en: "Images are processed entirely in memory and immediately discarded.", ja: "画像はすべてメモリ内で処理され、すぐに破棄されます。" }, l)}</li>
            <li>{pickLang({ en: "We do not store your photos.", ja: "写真を保存することはありません。" }, l)}</li>
            <li>{pickLang({ en: "Your dietary preferences remain on your device (session storage) and are only sent during the active scan request.", ja: "食事の好みはデバイス（セッションストレージ）に保持され、スキャンリクエスト時にのみ送信されます。" }, l)}</li>
            <li>{pickLang({ en: "No user accounts. No tracking.", ja: "ユーザーアカウントはありません。追跡も行いません。" }, l)}</li>
          </ul>
        </div>
      </section>

      <section className="bg-destructive/5 border border-destructive/20 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-destructive mb-2 flex items-center gap-2">
           <ShieldAlert className="w-5 h-5" />
           {pickLang({ en: "Important Disclaimer", ja: "重要な免責事項" }, l)}
        </h2>
        <p className="text-sm text-destructive/90 leading-relaxed">
          {pickLang({
            en: "This application provides assistive translations and automated analysis of food labels. It is NOT medical advice. OCR and AI analysis can make mistakes. Camera quality, lighting, and packaging folds can obscure critical ingredients. Always double-check labels manually, and consult with the manufacturer or medical professionals if you have a severe allergy.",
            ja: "このアプリケーションは、食品ラベルの補助的な翻訳と自動分析を提供します。医学的なアドバイスではありません。OCRやAI分析は間違いを犯す可能性があります。カメラの品質、照明、パッケージの折り目などにより、重要な成分が見えなくなることがあります。常に手動でラベルを再確認し、重度のアレルギーがある場合は製造元や医療専門家に相談してください。"
          }, l)}
        </p>
      </section>
    </div>
  );
}
