#!/usr/bin/env bash
# crop-title-blocks.sh — Crop the title block area from each page PNG
# Usage: crop-title-blocks.sh <pages-png-dir> <output-dir>
# Requires: sips (macOS) or ImageMagick
#
# Title blocks are in the bottom-right corner of construction plan sheets.
# This crops approximately the bottom-right 25% of each page — enough to
# capture the sheet ID, sheet title, and project info without loading the
# full drawing into context.
#
# Output: output-dir/title-block-01.png, title-block-02.png, etc.

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <pages-png-dir> <output-dir>"
  exit 1
fi

PNG_DIR="$1"
TB_DIR="$2"

mkdir -p "$TB_DIR"

for f in "${PNG_DIR}"/page-*.png; do
  basename_f=$(basename "$f" .png)
  num=$(echo "$basename_f" | sed 's/page-//')

  # Get image dimensions
  dims=$(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null)
  w=$(echo "$dims" | grep pixelWidth | awk '{print $2}')
  h=$(echo "$dims" | grep pixelHeight | awk '{print $2}')

  # Title block: rightmost 25% width, bottom 35% height
  # Architectural sheets: wide horizontal title block in bottom-right
  # Structural sheets: narrow vertical strip along right edge
  # This crop size captures both layouts reliably
  crop_w=$((w * 25 / 100))
  crop_h=$((h * 35 / 100))
  crop_x=$((w - crop_w))
  crop_y=$((h - crop_h))

  # Use sips to crop (macOS)
  # sips doesn't have a direct crop-to-region, so we use ImageMagick if available
  if command -v magick &>/dev/null; then
    magick "$f" -crop "${crop_w}x${crop_h}+${crop_x}+${crop_y}" +repage "${TB_DIR}/title-block-${num}.png" 2>/dev/null
  elif command -v convert &>/dev/null; then
    convert "$f" -crop "${crop_w}x${crop_h}+${crop_x}+${crop_y}" +repage "${TB_DIR}/title-block-${num}.png" 2>/dev/null
  else
    echo "Warning: ImageMagick not found. Cannot crop title blocks."
    echo "Install: brew install imagemagick"
    echo "Falling back to full-page reading for sheet ID identification."
    exit 1
  fi
done

CROPPED=$(ls "${TB_DIR}"/title-block-*.png 2>/dev/null | wc -l | tr -d ' ')
echo "Cropped $CROPPED title blocks to $TB_DIR"
