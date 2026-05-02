from app.utils.japanese import normalize_text


def test_full_width_ascii_normalized():
    assert normalize_text("ＡＢＣ１２３") == "ABC123"


def test_collapses_internal_whitespace_per_line():
    text = "原材料名 ：    小麦粉、 砂糖\n  アレルギー物質 ：  卵 "
    out = normalize_text(text)
    assert out.splitlines()[0] == "原材料名 : 小麦粉、 砂糖"
    assert out.splitlines()[1] == "アレルギー物質 : 卵"


def test_preserves_newlines_between_lines():
    text = "line1\nline2\nline3"
    assert normalize_text(text).splitlines() == ["line1", "line2", "line3"]


def test_empty_string():
    assert normalize_text("") == ""
