"""
Extract one PNG per lesson section from the FortiOS Study Guide PDF.
Reads tools/pdf-sections.json, renders each lesson's diagramPage (or startPage
as fallback) at 1.5x zoom, and saves both a PNG and a base64 data-URI .b64 file
under tools/pdf-slide-images/.
"""

import base64
import json
import pathlib
import sys

import fitz  # pymupdf

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = pathlib.Path(__file__).parent  # tools/
SECTIONS_JSON = SCRIPT_DIR / "pdf-sections.json"
OUTPUT_DIR = SCRIPT_DIR / "pdf-slide-images"
PDF_PATH = pathlib.Path(
    r"C:\Users\admin\Downloads\FortiOS_7.6_Administrator_Study_Guide-Online.pdf"
)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    # Validate inputs
    if not SECTIONS_JSON.exists():
        sys.exit(f"ERROR: sections file not found: {SECTIONS_JSON}")
    if not PDF_PATH.exists():
        sys.exit(f"ERROR: PDF not found: {PDF_PATH}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with SECTIONS_JSON.open(encoding="utf-8") as fh:
        sections: dict = json.load(fh)

    doc = fitz.open(str(PDF_PATH))
    total_pages = len(doc)

    mat = fitz.Matrix(1.5, 1.5)
    count = 0

    for chapter_lessons in sections.values():
        for lesson in chapter_lessons:
            lesson_id: str = lesson["lesson"]

            # Pick the page to render (1-indexed in JSON)
            page_1indexed: int = lesson.get("diagramPage") or lesson["startPage"]
            if not page_1indexed:
                page_1indexed = lesson["startPage"]

            # Convert to 0-indexed for fitz
            page_0indexed = page_1indexed - 1
            if page_0indexed < 0 or page_0indexed >= total_pages:
                print(
                    f"WARNING: {lesson_id} page {page_1indexed} out of range "
                    f"(PDF has {total_pages} pages) — skipping"
                )
                continue

            print(f"Processing {lesson_id} (page {page_1indexed})...")

            page = doc.load_page(page_0indexed)
            pix = page.get_pixmap(matrix=mat)

            png_bytes = pix.tobytes("png")

            # Save PNG
            png_path = OUTPUT_DIR / f"{lesson_id}.png"
            png_path.write_bytes(png_bytes)

            # Save base64 data URI
            b64_str = base64.b64encode(png_bytes).decode("ascii")
            data_uri = f"data:image/png;base64,{b64_str}"
            b64_path = OUTPUT_DIR / f"{lesson_id}.b64"
            b64_path.write_text(data_uri, encoding="ascii")

            count += 1

    doc.close()
    print(f"\nDone. {count} images extracted.")


if __name__ == "__main__":
    main()
