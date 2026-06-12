import re
import pathlib

root = pathlib.Path(__file__).resolve().parents[1] / "documents" / "formats"
snippet = (
    '\n    <script src="../../assets/js/document-actions.js"></script>'
    '\n    <script src="../../assets/js/mobile-preview-chrome.js"></script>'
)

for path in sorted(root.glob("*.html")):
    text = path.read_text(encoding="utf-8", errors="replace")
    orig = text
    text = re.sub(
        r"<script>\s*window\.addEventListener\('DOMContentLoaded'[\s\S]*?initial-scale=1\.2[\s\S]*?</script>\s*",
        "",
        text,
    )
    text = text.replace("shrink-to-fit=no", "")
    text = text.replace('user-scalable=yes, "', 'user-scalable=yes"')
    text = text.replace("user-scalable=yes, ", "user-scalable=yes")
    if "document-actions.js" not in text:
        text = re.sub(
            r'(<link rel="stylesheet" href="[^"]*document-common\.css[^"]*"\s*/?>)',
            r"\1" + snippet,
            text,
            count=1,
        )
    if text != orig:
        path.write_text(text, encoding="utf-8", errors="replace")
        print("updated", path.name)
