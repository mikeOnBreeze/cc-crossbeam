#!/usr/bin/env bash
# extract-pages.sh — Split a PDF into page PNGs at full DPI (no resize)
# Usage: extract-pages.sh <input.pdf> <output-dir>
# Requires: pdftoppm (from poppler)
# Output: output-dir/pages-png/page-01.png, page-02.png, etc.
#
# IMPORTANT: Pages are kept at full DPI (200 DPI on D-size = 7200x4800).
# Do NOT resize — the targeted page viewer sends one sheet at a time,
# so Claude gets maximum detail for reading dimensions, annotations, etc.

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input.pdf> <output-dir>"
  echo "  Splits a PDF into one PNG per page at 200 DPI. No resize."
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

# Idempotent: skip if PNGs already exist (pre-extracted)
EXISTING=$(ls "${PNG_DIR}"/page-*.png 2>/dev/null | wc -l | tr -d ' ')
if [ "$EXISTING" -gt 0 ]; then
  echo "Found $EXISTING existing page PNGs in $PNG_DIR — skipping extraction."
  echo "Done. $EXISTING pages ready in $PNG_DIR"
  exit 0
fi

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
  echo "Error: pdftoppm not found. Install: apt-get install poppler-utils (Linux) or brew install poppler (macOS)"
  exit 1
fi

EXTRACTED=$(ls "${PNG_DIR}"/page-*.png 2>/dev/null | wc -l | tr -d ' ')
echo "Done. $EXTRACTED pages ready in $PNG_DIR (full DPI, no resize)"
