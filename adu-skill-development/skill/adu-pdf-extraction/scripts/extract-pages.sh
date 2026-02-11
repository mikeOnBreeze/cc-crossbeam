#!/usr/bin/env bash
# extract-pages.sh — Split a PDF into individual page PNGs
# Usage: extract-pages.sh <input.pdf> <output-dir>
# Requires: pdftoppm (from poppler) or ImageMagick as fallback
# Output: output-dir/pages-png/page-01.png, page-02.png, etc.

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input.pdf> <output-dir>"
  echo "  Splits a PDF into one PNG per page at 200 DPI."
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
    num=$(echo "$basename" | sed 's/page-*\([0-9]*\)\.png/\1/')
    padded=$(printf "%02d" "$num")
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
echo "Done. Extracted $EXTRACTED page PNGs to $PNG_DIR"
ls -lh "${PNG_DIR}"/page-*.png
