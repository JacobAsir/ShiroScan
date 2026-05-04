import { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { useSessionStore } from "@/store/sessionStore";
import { pickLang, ALLERGEN_OPTIONS, DIETARY_OPTIONS, ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_MB } from "@/lib/constants";
import { analyzeImage } from "@/services/analyzeService";
import { ResultPanel } from "@/components/ResultPanel";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Camera, Image as ImageIcon, AlertTriangle, UploadCloud, Search, X, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Scan() {
  const {
    preferences, toggleAllergy, toggleDietary,
    addCustomAllergy, removeCustomAllergy,
    addCustomDietary, removeCustomDietary,
  } = usePreferences();
  const l = preferences.language;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customAllergyInput, setCustomAllergyInput] = useState("");
  const [customDietaryInput, setCustomDietaryInput] = useState("");

  // Session store
  const addSession = useSessionStore((s) => s.addSession);
  const activeSession = useSessionStore((s) => s.getActiveSession());
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  const analyzeImgMutation = useMutation({
    mutationFn: analyzeImage,
    onSuccess: (data) => {
      addSession({
        imageUrl: previewUrl || "",
        productName: data.product_name,
        status: data.status,
        result: data,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || pickLang({ en: "Failed to analyze image", ja: "画像の分析に失敗しました" }, l));
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(pickLang({ en: "Invalid file type. Please upload a JPEG, PNG, WEBP, or HEIC.", ja: "無効なファイル形式です。" }, l));
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(pickLang({ en: `File too large. Max ${MAX_UPLOAD_MB}MB.`, ja: `ファイルが大きすぎます。最大${MAX_UPLOAD_MB}MB。` }, l));
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Clear active session when uploading new image
    setActiveSession(null);
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    analyzeImgMutation.mutate({ image: selectedFile, preferences });
  };

  const handleNewScan = () => {
    setActiveSession(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    analyzeImgMutation.reset();
  };

  const handleCustomAllergyAdd = () => {
    if (customAllergyInput.trim()) {
      addCustomAllergy(customAllergyInput);
      setCustomAllergyInput("");
    }
  };

  const handleCustomDietaryAdd = () => {
    if (customDietaryInput.trim()) {
      addCustomDietary(customDietaryInput);
      setCustomDietaryInput("");
    }
  };

  const handleAllergyKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleCustomAllergyAdd(); }
  };

  const handleDietaryKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleCustomDietaryAdd(); }
  };

  const isAnalyzing = analyzeImgMutation.isPending;
  const displayResult = activeSession?.result ?? null;
  const displayImageUrl = activeSession?.imageUrl ?? previewUrl;

  // Loading overlay
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-500">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <Search className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{pickLang({ en: "Analyzing label...", ja: "ラベルを分析中..." }, l)}</h2>
          <p className="text-muted-foreground text-sm">
            {pickLang({ en: "Reading Japanese text and checking ingredients.", ja: "日本語のテキストを読み取り、成分を確認しています。" }, l)}
          </p>
        </div>
        <Progress value={undefined} className="w-full max-w-xs" />
      </div>
    );
  }

  return (
    <div className={`animate-in fade-in duration-500 ${displayResult ? "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start lg:h-[calc(100vh-7.5rem)] lg:overflow-hidden" : "max-w-2xl mx-auto w-full"}`}>
      {/* ─── Left Panel: Preferences + Image ─── */}
      <div className={`space-y-6 ${displayResult ? "lg:h-full lg:overflow-y-auto lg:pr-2 custom-scrollbar" : ""}`}>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {pickLang({ en: "Scan a Product", ja: "製品をスキャン" }, l)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pickLang({ en: "Select what you need to avoid, then scan.", ja: "避けるべきものを選択してスキャン。" }, l)}
          </p>
        </div>

        {/* Preferences Tabs */}
        <Tabs defaultValue="allergies" className="w-full">
          {/* ... tabs content stays same ... */}
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="allergies" className="text-xs">{pickLang({ en: "Allergies", ja: "アレルギー" }, l)}</TabsTrigger>
            <TabsTrigger value="dietary" className="text-xs">{pickLang({ en: "Dietary", ja: "食事制限" }, l)}</TabsTrigger>
          </TabsList>

          <TabsContent value="allergies" className="space-y-3">
            {/* Preset allergens */}
            <div className="flex flex-wrap gap-1.5">
              {ALLERGEN_OPTIONS.map((opt) => {
                const selected = preferences.allergies.includes(opt.key);
                return (
                  <Badge
                    key={opt.key}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1 px-2.5 select-none hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                    onClick={() => toggleAllergy(opt.key)}
                  >
                    {pickLang(opt.label, l)}
                  </Badge>
                );
              })}
            </div>

            {/* Custom allergens */}
            {preferences.custom_allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {preferences.custom_allergies.map((term) => (
                  <Badge key={term} variant="default" className="text-xs py-1 px-2.5 gap-1 bg-orange-600 hover:bg-orange-700">
                    {term}
                    <button onClick={() => removeCustomAllergy(term)} className="ml-0.5 hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add custom input */}
            <div className="flex gap-2">
              <Input
                value={customAllergyInput}
                onChange={(e) => setCustomAllergyInput(e.target.value)}
                onKeyDown={handleAllergyKeyDown}
                placeholder={pickLang({ en: "Add custom allergy (e.g. ナッツ)...", ja: "カスタムアレルギーを追加..." }, l)}
                className="h-8 text-xs"
              />
              <Button size="sm" variant="outline" onClick={handleCustomAllergyAdd} className="h-8 px-3 shrink-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="dietary" className="space-y-3">
            {/* Preset dietary */}
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_OPTIONS.map((opt) => {
                const selected = preferences.dietary.includes(opt.key);
                return (
                  <Badge
                    key={opt.key}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1 px-2.5 select-none hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                    onClick={() => toggleDietary(opt.key)}
                  >
                    {pickLang(opt.label, l)}
                  </Badge>
                );
              })}
            </div>

            {/* Custom dietary */}
            {preferences.custom_dietary.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {preferences.custom_dietary.map((term) => (
                  <Badge key={term} variant="default" className="text-xs py-1 px-2.5 gap-1 bg-violet-600 hover:bg-violet-700">
                    {term}
                    <button onClick={() => removeCustomDietary(term)} className="ml-0.5 hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add custom input */}
            <div className="flex gap-2">
              <Input
                value={customDietaryInput}
                onChange={(e) => setCustomDietaryInput(e.target.value)}
                onKeyDown={handleDietaryKeyDown}
                placeholder={pickLang({ en: "Add custom restriction...", ja: "カスタム制限を追加..." }, l)}
                className="h-8 text-xs"
              />
              <Button size="sm" variant="outline" onClick={handleCustomDietaryAdd} className="h-8 px-3 shrink-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Image Upload */}
        <Card className="overflow-hidden border-2 border-dashed">
          <CardContent className="p-0">
            {!previewUrl ? (
              <div className="flex flex-col items-center justify-center min-h-[240px] p-6 text-center bg-muted/20">
                <div className="w-14 h-14 mb-3 rounded-full bg-secondary flex items-center justify-center">
                  <Camera className="w-7 h-7 text-secondary-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">
                  {pickLang({ en: "Take a photo or upload", ja: "写真を撮るかアップロード" }, l)}
                </h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-sm">
                  {pickLang({ en: "Ensure the ingredients list is clearly visible.", ja: "成分表がはっきり見えることを確認。" }, l)}
                </p>
                <div className="flex gap-3">
                  <input
                    type="file" accept="image/*" capture="environment"
                    className="hidden" ref={fileInputRef} onChange={handleFileChange}
                  />
                  <Button onClick={() => fileInputRef.current?.click()} size="default" className="rounded-xl">
                    <Camera className="w-4 h-4 mr-2" />
                    {pickLang({ en: "Camera", ja: "カメラ" }, l)}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.click();
                    }
                  }} size="default" className="rounded-xl">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {pickLang({ en: "Gallery", ja: "ギャラリー" }, l)}
                  </Button>
                </div>

                {/* Sample Images Section */}
                <div className="mt-8 pt-6 border-t w-full">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {pickLang({ en: "Try with a sample", ja: "サンプルで試す" }, l)}
                  </p>
                  <div className="flex justify-center gap-4">
                    {[
                      { id: 1, path: "/samples/sample1.png", name: "Sample 1" },
                      { id: 2, path: "/samples/sample2.png", name: "Sample 2" },
                    ].map((sample) => (
                      <button
                        key={sample.id}
                        onClick={async () => {
                          try {
                            const response = await fetch(sample.path);
                            const blob = await response.blob();
                            const file = new File([blob], `sample${sample.id}.png`, { type: "image/png" });
                            setSelectedFile(file);
                            setPreviewUrl(sample.path);
                            setActiveSession(null);
                          } catch (err) {
                            toast.error("Failed to load sample image");
                          }
                        }}
                        className="group relative w-20 h-20 rounded-lg overflow-hidden border bg-muted hover:border-primary transition-all"
                      >
                        <img src={sample.path} alt={sample.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                          <Plus className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative group bg-black/5">
                <img src={previewUrl} alt="Preview" className={`w-full h-auto object-contain ${displayResult ? "max-h-[500px]" : "max-h-[calc(100vh-20rem)]"}`} />
                
                {/* Remove Image Button */}
                <button 
                  onClick={handleNewScan}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
                  title={pickLang({ en: "Remove Image", ja: "画像を削除" }, l)}
                >
                  <X className="w-5 h-5" />
                </button>

                {!displayResult && (
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="sm" className="shadow-sm">
                        <ImageIcon className="w-3 h-3 mr-1.5" />
                        {pickLang({ en: "Change Image", ja: "画像を変更" }, l)}
                      </Button>
                      <Button onClick={handleAnalyze} size="sm" className="bg-primary text-primary-foreground shadow-sm">
                        <UploadCloud className="w-3 h-3 mr-1.5" />
                        {pickLang({ en: "Analyze", ja: "分析" }, l)}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Mobile Bottom CTA */}
                {!displayResult && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center lg:hidden">
                    <Button onClick={handleAnalyze} size="lg" className="shadow-lg w-[85%] font-bold">
                      {pickLang({ en: "Analyze Image", ja: "画像を分析" }, l)}
                    </Button>
                  </div>
                )}

                <input
                  type="file" accept="image/*" capture="environment"
                  className="hidden" ref={fileInputRef} onChange={handleFileChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Right Panel: Results ─── */}
      {displayResult && (
        <div className="lg:h-full lg:overflow-hidden">
          <ResultPanel result={displayResult} />
        </div>
      )}
    </div>

  );
}
