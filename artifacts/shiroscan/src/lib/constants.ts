import type { AllergenKey, DietaryKey, UILanguage } from "@/types/analysis";

export interface BilingualLabel {
  en: string;
  ja: string;
}

export const ALLERGEN_OPTIONS: Array<{
  key: AllergenKey;
  label: BilingualLabel;
  japanese_keyword: string;
}> = [
  { key: "egg", label: { en: "Egg", ja: "卵" }, japanese_keyword: "卵" },
  { key: "milk", label: { en: "Milk", ja: "乳" }, japanese_keyword: "乳" },
  { key: "wheat", label: { en: "Wheat", ja: "小麦" }, japanese_keyword: "小麦" },
  { key: "shrimp", label: { en: "Shrimp", ja: "えび" }, japanese_keyword: "えび" },
  { key: "crab", label: { en: "Crab", ja: "かに" }, japanese_keyword: "かに" },
  { key: "peanuts", label: { en: "Peanuts", ja: "落花生" }, japanese_keyword: "落花生" },
  { key: "buckwheat", label: { en: "Buckwheat", ja: "そば" }, japanese_keyword: "そば" },
  { key: "walnuts", label: { en: "Walnuts", ja: "くるみ" }, japanese_keyword: "くるみ" },
  { key: "soy", label: { en: "Soy", ja: "大豆" }, japanese_keyword: "大豆" },
  { key: "sesame", label: { en: "Sesame", ja: "ごま" }, japanese_keyword: "ごま" },
];

export const DIETARY_OPTIONS: Array<{
  key: DietaryKey;
  label: BilingualLabel;
}> = [
  { key: "vegetarian", label: { en: "Vegetarian", ja: "ベジタリアン" } },
  { key: "halal", label: { en: "Halal", ja: "ハラル" } },
  { key: "no_pork", label: { en: "No pork", ja: "豚肉なし" } },
  { key: "lactose_free", label: { en: "Lactose-free", ja: "乳糖なし" } },
];

export const STATUS_LABELS: Record<"safe" | "caution" | "avoid" | "info", BilingualLabel> = {
  safe: { en: "Safe", ja: "安全" },
  caution: { en: "Caution", ja: "注意" },
  avoid: { en: "Avoid", ja: "回避" },
  info: { en: "Scanned", ja: "スキャン完了" },
};

export const UI_COPY = {
  appName: { en: "ShiroScan", ja: "シロスキャン" },
  tagline: {
    en: "Understand any Japanese food label in seconds.",
    ja: "日本の食品ラベルを瞬時に理解。",
  },
  cta: { en: "Start scanning", ja: "スキャンを開始" },
} as const;

export const MAX_UPLOAD_MB = 10;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export function pickLang(label: BilingualLabel, lang: UILanguage): string {
  return label[lang] ?? label.en;
}
