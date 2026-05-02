import { useState, useRef, ChangeEvent } from "react";
import { useLocation } from "wouter";
import { usePreferences } from "@/hooks/usePreferences";
import { useResult } from "@/contexts/ResultContext";
import { pickLang, ALLERGEN_OPTIONS, DIETARY_OPTIONS, ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_MB } from "@/lib/constants";
import { analyzeImage, analyzeDemoSample, fetchDemoSamples } from "@/services/analyzeService";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Image as ImageIcon, Loader2, AlertTriangle, UploadCloud } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Scan() {
  const { preferences, toggleAllergy, toggleDietary } = usePreferences();
  const l = preferences.language;
  const [, setLocation] = useLocation();
  const { setResult } = useResult();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: demoSamples, isLoading: loadingDemos } = useQuery({
    queryKey: ["demo-samples"],
    queryFn: fetchDemoSamples,
  });

  const analyzeImgMutation = useMutation({
    mutationFn: analyzeImage,
    onSuccess: (data) => {
      setResult(data);
      setLocation("/result");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to analyze image");
    }
  });

  const analyzeDemoMutation = useMutation({
    mutationFn: analyzeDemoSample,
    onSuccess: (data) => {
      setResult(data);
      setLocation("/result");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to analyze demo sample");
    }
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(pickLang({ en: "Invalid file type. Please upload a JPEG, PNG, WEBP, or HEIC.", ja: "無効なファイル形式です。JPEG、PNG、WEBP、またはHEICをアップロードしてください。" }, l));
      return;
    }

    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(pickLang({ en: `File too large. Maximum size is ${MAX_UPLOAD_MB}MB.`, ja: `ファイルが大きすぎます。最大サイズは${MAX_UPLOAD_MB}MBです。` }, l));
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    analyzeImgMutation.mutate({ image: selectedFile, preferences });
  };

  const handleDemoClick = (sampleId: string) => {
    analyzeDemoMutation.mutate({ sampleId, preferences });
  };

  const isAnalyzing = analyzeImgMutation.isPending || analyzeDemoMutation.isPending;

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-500">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <Search className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{pickLang({ en: "Analyzing label...", ja: "ラベルを分析中..." }, l)}</h2>
          <p className="text-muted-foreground">
            {pickLang({ en: "Reading Japanese text and checking ingredients.", ja: "日本語のテキストを読み取り、成分を確認しています。" }, l)}
          </p>
        </div>
        <Progress value={undefined} className="w-full max-w-xs" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {pickLang({ en: "Scan a Product", ja: "製品をスキャン" }, l)}
        </h1>
        <p className="text-muted-foreground">
          {pickLang({ en: "First, select what you need to avoid.", ja: "まず、避けるべきものを選択してください。" }, l)}
        </p>
      </div>

      <Tabs defaultValue="allergies" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="allergies">{pickLang({ en: "Allergies", ja: "アレルギー" }, l)}</TabsTrigger>
          <TabsTrigger value="dietary">{pickLang({ en: "Dietary", ja: "食事制限" }, l)}</TabsTrigger>
        </TabsList>
        <TabsContent value="allergies" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((opt) => {
              const selected = preferences.allergies.includes(opt.key);
              return (
                <Badge
                  key={opt.key}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3 select-none hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                  onClick={() => toggleAllergy(opt.key)}
                >
                  {pickLang(opt.label, l)}
                </Badge>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="dietary" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => {
              const selected = preferences.dietary.includes(opt.key);
              return (
                <Badge
                  key={opt.key}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3 select-none hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                  onClick={() => toggleDietary(opt.key)}
                >
                  {pickLang(opt.label, l)}
                </Badge>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {(preferences.allergies.length === 0 && preferences.dietary.length === 0) && (
        <Alert variant="default" className="bg-muted/50 border-none">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{pickLang({ en: "No preferences set", ja: "設定がありません" }, l)}</AlertTitle>
          <AlertDescription>
            {pickLang({ en: "You haven't selected any allergies or dietary restrictions. The app will only provide a translation.", ja: "アレルギーや食事制限が選択されていません。アプリは翻訳のみを提供します。" }, l)}
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-2 border-dashed">
        <CardContent className="p-0">
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-muted/20">
              <div className="w-16 h-16 mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Camera className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {pickLang({ en: "Take a photo or upload", ja: "写真を撮るかアップロード" }, l)}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {pickLang({ en: "Ensure the ingredients list is clearly visible and well-lit.", ja: "成分表がはっきりと見え、明るいことを確認してください。" }, l)}
              </p>
              <div className="flex gap-4">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button onClick={() => fileInputRef.current?.click()} size="lg" className="rounded-xl">
                  <Camera className="w-4 h-4 mr-2" />
                  {pickLang({ en: "Open Camera", ja: "カメラを開く" }, l)}
                </Button>
                <Button variant="outline" onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }} size="lg" className="rounded-xl">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {pickLang({ en: "Gallery", ja: "ギャラリー" }, l)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[500px] object-contain bg-black/5" />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <div className="flex flex-col gap-3">
                  <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="lg">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {pickLang({ en: "Choose Different Image", ja: "別の画像を選択" }, l)}
                  </Button>
                  <Button onClick={handleAnalyze} size="lg" className="bg-primary text-primary-foreground">
                    <UploadCloud className="w-4 h-4 mr-2" />
                    {pickLang({ en: "Analyze Image", ja: "画像を分析" }, l)}
                  </Button>
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center md:hidden">
                 <Button onClick={handleAnalyze} size="lg" className="shadow-lg w-[90%] font-bold text-lg">
                    {pickLang({ en: "Analyze Image", ja: "画像を分析" }, l)}
                 </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Samples */}
      <div className="pt-8 border-t border-border">
        <h3 className="text-lg font-semibold mb-4">
          {pickLang({ en: "Or try a sample label", ja: "またはサンプルラベルを試す" }, l)}
        </h3>
        {loadingDemos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {demoSamples?.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleDemoClick(sample.id)}
                className="flex flex-col text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="font-semibold flex items-center gap-2 mb-1">
                  {sample.thumbnail_emoji && <span className="text-xl">{sample.thumbnail_emoji}</span>}
                  <span className="group-hover:text-primary transition-colors">{sample.product_name}</span>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {pickLang({ en: sample.description_en, ja: sample.description_ja }, l)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Need to import Search from lucide-react for the loader
import { Search } from "lucide-react";
