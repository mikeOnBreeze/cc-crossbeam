#!/usr/bin/env bash
# extract-pages.sh — Split a PDF into page PNGs + Tesseract text
# Usage: extract-pages.sh <input.pdf> <output-dir>
# Requires: pdftoppm (from poppler) or ImageMagick as fallback
#           tesseract (optional, for hybrid text cross-reference)
#           sips (macOS) for image resize
# Output: output-dir/pages-png/page-01.png, page-02.png, etc.
#         output-dir/pages-text/page-01.txt, page-02.txt, etc.

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input.pdf> <output-dir>"
  echo "  Splits a PDF into one PNG per page at 200 DPI."
  exit 1
fi

INPUT_PDF="$1"
OUTPUT_DIR="$2"
PNG_DIR="${OUTPUT_DIR}/pages-png"
TEXT_DIR="${OUTPUT_DIR}/pages-text"

if [ ! -f "$INPUT_PDF" ]; then
  echo "Error: File not found: $INPUT_PDF"
  exit 1
fi

mkdir -p "$PNG_DIR" "$TEXT_DIR"

# Get page count
PAGE_COUNT=$(pdfinfo "$INPUT_PDF" 2>/dev/null | grep "^Pages:" | awk '{print $2}')
if [ -z "$PAGE_COUNT" ]; then
  echo "Warning: Could not determine page count. Proceeding anyway."
  PAGE_COUNT="?"
fi

echo "Extracting $PAGE_COUNT pages from: $INPUT_PDF"
echo "Output directory: $PNG_DIR"
echo "DPI: 200"

if command -v pdftoppm &>/dev/null; then
  # pdftoppm outputs as prefix-01.png, prefix-02.png, etc.
  # Suppress Poppler "Marked Content" warnings — common with CAD-generated PDFs,
  # harmless, does not affect PNG output quality.
  pdftoppm -png -r 200 "$INPUT_PDF" "${PNG_DIR}/page" 2>/dev/null

  # Rename to zero-padded format: page-01.png, page-02.png
  for f in "${PNG_DIR}"/page-*.png; do
    basename=$(basename "$f")
    # Extract the number part (handles both page-1.png and page-01.png)
    num=$(echo "$basename" | sed 's/page-0*\([0-9]*\)\.png/\1/')
    # Use 10# to force base-10 interpretation (avoids octal issues with 08, 09)
    padded=$(printf "%02d" "$((10#$num))")
    new_name="page-${padded}.png"
    if [ "$basename" != "$new_name" ]; then
      mv "$f" "${PNG_DIR}/${new_name}"
    fi
  done

elif command -v magick &>/dev/null; then
  echo "pdftoppm not found, falling back to ImageMagick..."
  magick -density 200 "$INPUT_PDF" -quality 90 "${PNG_DIR}/page-%02d.png"
else
  echo "Error: Neither pdftoppm nor ImageMagick found."
  echo "Install poppler: brew install poppler"
  echo "  or ImageMagick: brew install imagemagick"
  exit 1
fi

EXTRACTED=$(ls "${PNG_DIR}"/page-*.png 2>/dev/null | wc -l | tr -d ' ')
echo "Extracted $EXTRACTED page PNGs to $PNG_DIR"

# --- Step 2: Resize PNGs for API consumption ---
# Claude API resizes images to 1568px max internally. Anything larger just
# wastes upload bandwidth. Construction PDFs at 200 DPI on D-size sheets
# produce 7200x4800 PNGs — way too large.
echo ""
echo "Resizing PNGs to max 1568px (API internal limit)..."
for f in "${PNG_DIR}"/page-*.png; do
  # Check if longest side exceeds 1568
  dims=$(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null)
  w=$(echo "$dims" | grep pixelWidth | awk '{print $2}')
  h=$(echo "$dims" | grep pixelHeight | awk '{print $2}')
  max=$((w > h ? w : h))
  if [ "$max" -gt 1568 ]; then
    sips --resampleHeightWidthMax 1568 "$f" -o "$f" 2>/dev/null
  fi
done
echo "Resize complete."

# --- Step 3: Tesseract OCR for hybrid text cross-reference ---
# Runs Tesseract on each PNG to produce raw text files. These are NOT the
# primary extraction — vision is. The text files give subagents a second
# source for exact numeric values that vision may hallucinate at low
# resolution (e.g., sq ft, setback dimensions, lot coverage percentages).
# On drawing-heavy pages, Tesseract output will be garbage — subagents
# are instructed to recognize and ignore it.
if command -v tesseract &>/dev/null; then
  echo ""
  echo "Running Tesseract OCR on each page..."
  for f in "${PNG_DIR}"/page-*.png; do
    basename=$(basename "$f" .png)
    tesseract "$f" "${TEXT_DIR}/${basename}" 2>/dev/null
  done
  TEXT_COUNT=$(ls "${TEXT_DIR}"/page-*.txt 2>/dev/null | wc -l | tr -d ' ')
  echo "Tesseract complete. $TEXT_COUNT text files in $TEXT_DIR"
else
  echo ""
  echo "Warning: tesseract not found. Skipping OCR text extraction."
  echo "Install: brew install tesseract"
  echo "Vision-only extraction will still work, but numeric cross-reference"
  echo "will not be available."
fi

echo ""
echo "Done. $EXTRACTED pages ready for vision extraction."
ls -lh "${PNG_DIR}"/page-*.png
