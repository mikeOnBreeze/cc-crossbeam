#!/usr/bin/env bash
# extract-pages.sh — Split a PDF into page PNGs, resized for API consumption
# Usage: extract-pages.sh <input.pdf> <output-dir>
# Requires: pdftoppm (from poppler), sips (macOS) for resize
# Output: output-dir/pages-png/page-01.png, page-02.png, etc.

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input.pdf> <output-dir>"
  echo "  Splits a PDF into one PNG per page at 200 DPI, resized for API use."
  exit 1
fi

INPUT_PDF="$1"
OUTPUT_DIR="$2"
PNG_DIR="${OUTPUT_DIR}/pages-png"

if [ ! -f "$INPUT_PDF" ]; then
  echo "Error: File not found: $INPUT_PDF"
  exit 1
fi

mkdir -p "$PNG_DIR"

# Get page count
PAGE_COUNT=$(pdfinfo "$INPUT_PDF" 2>/dev/null | grep "^Pages:" | awk '{print $2}')
if [ -z "$PAGE_COUNT" ]; then
  echo "Warning: Could not determine page count."
  PAGE_COUNT="?"
fi

echo "Extracting $PAGE_COUNT pages from: $INPUT_PDF"

if command -v pdftoppm &>/dev/null; then
  pdftoppm -png -r 200 "$INPUT_PDF" "${PNG_DIR}/page" 2>/dev/null

  # Rename to zero-padded format: page-01.png, page-02.png
  for f in "${PNG_DIR}"/page-*.png; do
    basename_f=$(basename "$f")
    num=$(echo "$basename_f" | sed 's/page-0*\([0-9]*\)\.png/\1/')
    padded=$(printf "%02d" "$((10#$num))")
    new_name="page-${padded}.png"
    if [ "$basename_f" != "$new_name" ]; then
      mv "$f" "${PNG_DIR}/${new_name}"
    fi
  done
else
  echo "Error: pdftoppm not found. Install: brew install poppler"
  exit 1
fi

EXTRACTED=$(ls "${PNG_DIR}"/page-*.png 2>/dev/null | wc -l | tr -d ' ')
echo "Extracted $EXTRACTED page PNGs"

# Resize for API consumption (Claude max 1568px internally)
echo "Resizing to max 1568px..."
for f in "${PNG_DIR}"/page-*.png; do
  dims=$(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null)
  w=$(echo "$dims" | grep pixelWidth | awk '{print $2}')
  h=$(echo "$dims" | grep pixelHeight | awk '{print $2}')
  max=$((w > h ? w : h))
  if [ "$max" -gt 1568 ]; then
    sips --resampleHeightWidthMax 1568 "$f" -o "$f" 2>/dev/null
  fi
done

echo "Done. $EXTRACTED pages ready in $PNG_DIR"
