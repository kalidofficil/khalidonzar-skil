#!/usr/bin/env python3
"""Inline the CSS and JS into one portable HTML file.

Useful for hosting the site somewhere that only takes a single file, or for
emailing a preview. Writes dist/index.html; the Google Fonts link is left as-is
so the page still needs a network connection for its typefaces.

    python3 scripts/build-single-file.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "assets/css/styles.css").read_text(encoding="utf-8")
    js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")
    favicon = (ROOT / "assets/favicon.svg").read_text(encoding="utf-8")

    html = html.replace(
        '<link rel="stylesheet" href="assets/css/styles.css">',
        "<style>\n" + css + "\n</style>",
    )
    html = html.replace(
        '<script src="assets/js/main.js" defer></script>',
        "<script>\n" + js + "\n</script>",
    )

    # The favicon has to travel with the file too.
    data_uri = "data:image/svg+xml," + re.sub(r"\s+", " ", favicon).replace("#", "%23").strip()
    html = html.replace('href="assets/favicon.svg"', f'href="{data_uri}"')

    DIST.mkdir(exist_ok=True)
    out = DIST / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
