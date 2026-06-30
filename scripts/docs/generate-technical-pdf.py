#!/usr/bin/env python3
"""Build HTML and PDF from docs/TECHNICAL_DOCUMENTATION.md."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
MD_PATH = DOCS / "TECHNICAL_DOCUMENTATION.md"
HTML_PATH = DOCS / "TECHNICAL_DOCUMENTATION.html"
PDF_PATH = DOCS / "Chain-Explorer-Technical-Documentation.pdf"
CSS_PATH = DOCS / "styles" / "print.css"

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chain Explorer — Technical Documentation</title>
  <link rel="stylesheet" href="styles/print.css">
</head>
<body>
  <div class="doc-cover">
    <p class="doc-cover__meta">Technical Documentation</p>
    <h1>Chain Explorer</h1>
    <p class="doc-cover__subtitle">Educational Blockchain Simulator</p>
    <p class="doc-cover__version">Version 2.0.0 · Generated from source</p>
    <p class="doc-cover__note">Account-model Proof-of-Work · FastAPI · Vanilla JS</p>
  </div>
  <div class="doc-body">
{body}
  </div>
</body>
</html>
"""


def build_html() -> None:
    try:
        import markdown
    except ImportError as exc:
        raise SystemExit("Install markdown: pip install markdown") from exc

    if not MD_PATH.exists():
        raise SystemExit(f"Missing {MD_PATH}")

    md_text = MD_PATH.read_text(encoding="utf-8")
    body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "toc", "attr_list"],
        extension_configs={"toc": {"permalink": False, "toc_depth": 3}},
    )
    html = HTML_TEMPLATE.format(body=body)
    HTML_PATH.write_text(html, encoding="utf-8")
    print(f"Wrote {HTML_PATH}")


def build_pdf() -> None:
    chromium = (
        shutil.which("chromium-browser")
        or shutil.which("chromium")
        or shutil.which("google-chrome")
    )
    if not chromium:
        raise SystemExit("Chromium/Chrome not found — open HTML and print to PDF manually.")

    url = HTML_PATH.resolve().as_uri()
    cmd = [
        chromium,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--print-to-pdf={PDF_PATH}",
        "--print-to-pdf-no-header",
        url,
    ]
    subprocess.run(cmd, check=True)
    print(f"Wrote {PDF_PATH}")


def main() -> None:
    build_html()
    if "--html-only" not in sys.argv:
        build_pdf()


if __name__ == "__main__":
    main()
