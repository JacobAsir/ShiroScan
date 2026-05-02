"""Built-in sample/demo fixtures used by:
- /api/demo-samples (list of sample labels the user can try)
- /api/analyze-demo  (run analysis against a chosen sample)
- MockOCRProvider    (when running fully offline)

These are realistic Japanese label snippets covering the common shapes:
allergen-rich snack, plain rice cracker, dairy product with cross-contamination,
pork-containing curry roux, and a vegetarian-friendly miso.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SampleFixture:
    id: str
    product_name: str
    description_en: str
    description_ja: str
    ocr_text: str

    @property
    def preview_text(self) -> str:
        # Short multi-line excerpt for UI display
        return "\n".join(self.ocr_text.splitlines()[:6])


SAMPLE_FIXTURES: tuple[SampleFixture, ...] = (
    SampleFixture(
        id="choco-cookie",
        product_name="チョコチップクッキー",
        description_en="Chocolate-chip cookies — wheat, milk, egg, soy",
        description_ja="チョコチップクッキー（小麦・乳・卵・大豆）",
        ocr_text=(
            "チョコチップクッキー\n"
            "原材料名：小麦粉、砂糖、ショートニング、チョコチップ"
            "（砂糖、カカオマス、全粉乳、ココアバター、乳化剤（大豆由来）、香料）、"
            "鶏卵、食塩、膨張剤、香料\n"
            "アレルギー物質（特定原材料等）：小麦・乳成分・卵・大豆\n"
            "本品製造工場では落花生を含む製品を生産しています。\n"
            "内容量：12枚\n"
            "保存方法：直射日光・高温多湿を避けて保存してください。"
        ),
    ),
    SampleFixture(
        id="rice-cracker",
        product_name="醤油せんべい",
        description_en="Soy-sauce rice crackers — wheat & soy notice",
        description_ja="醤油せんべい（小麦・大豆を含む）",
        ocr_text=(
            "醤油せんべい\n"
            "原材料名：うるち米（国産）、しょうゆ（大豆・小麦を含む）、"
            "砂糖、みりん、調味料（アミノ酸等）\n"
            "アレルギー物質：一部に小麦・大豆を含む\n"
            "内容量：18枚"
        ),
    ),
    SampleFixture(
        id="curry-roux",
        product_name="ポークカレールウ",
        description_en="Pork curry roux — contains pork & wheat",
        description_ja="ポークカレールウ（豚肉・小麦を含む）",
        ocr_text=(
            "ポークカレールウ 中辛\n"
            "原材料名：食用油脂（ラード（豚由来）、パーム油）、小麦粉、砂糖、食塩、"
            "カレーパウダー、ポークエキス、玉ねぎパウダー、にんにくパウダー、"
            "酵母エキス、香辛料\n"
            "アレルギー物質：一部に小麦・豚肉・大豆を含む\n"
            "内容量：120g"
        ),
    ),
    SampleFixture(
        id="miso-paste",
        product_name="信州味噌",
        description_en="Shinshu miso paste — soy-based, vegetarian-friendly",
        description_ja="信州味噌（大豆ベース、ベジタリアン対応）",
        ocr_text=(
            "信州味噌\n"
            "原材料名：大豆（国産）、米、食塩、酒精\n"
            "アレルギー物質：一部に大豆を含む\n"
            "内容量：750g\n"
            "保存方法：直射日光を避け、開封後は冷蔵庫で保存してください。"
        ),
    ),
    SampleFixture(
        id="yogurt-drink",
        product_name="飲むヨーグルト",
        description_en="Drinkable yogurt — milk-based, trace cross-contamination",
        description_ja="飲むヨーグルト（乳成分使用）",
        ocr_text=(
            "飲むヨーグルト いちご\n"
            "原材料名：生乳、砂糖、いちご果汁、乳製品、安定剤（ペクチン）、香料\n"
            "アレルギー物質：一部に乳成分を含む\n"
            "同一工場でくるみを含む製品を製造しています。\n"
            "内容量：180ml"
        ),
    ),
)


def get_sample(sample_id: str) -> SampleFixture | None:
    for s in SAMPLE_FIXTURES:
        if s.id == sample_id:
            return s
    return None
