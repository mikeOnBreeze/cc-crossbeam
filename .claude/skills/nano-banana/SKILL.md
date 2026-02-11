---
name: nano-banana
description: This skill enables image generation and editing using Google's Gemini Nano Banana models. Use this skill when the user asks to generate images from text prompts, edit existing images, or modify pictures. Supports text-to-image generation, image editing with prompts, and multi-image reference for consistency.
---

# Nano Banana

Image generation and editing skill powered by Google Gemini's Nano Banana models.

## Prerequisites

This skill requires a `GEMINI_API_KEY` in the project's `.env` or `.env.local` file:

```env
GEMINI_API_KEY=your_api_key_here
```

To obtain an API key, visit: https://aistudio.google.com/apikey

## Capabilities

### 1. Text-to-Image Generation

Generate images from text descriptions using `scripts/generate_image.py`:

```bash
python scripts/generate_image.py "a serene Japanese garden with cherry blossoms" \
  --aspect-ratio 16:9
```

**Parameters:**
- `prompt` (required): Text description of the image to generate
- `--output`: Output directory or file path (default: current directory)
- `--filename`: Custom filename (default: auto-generated with timestamp)
- `--aspect-ratio`: Image aspect ratio (default: 1:1)
- `--model`: Model to use (default: gemini-3-pro-image-preview)

### 2. Image Editing

Edit existing images with text prompts using `scripts/edit_image.py`:

```bash
python scripts/edit_image.py "remove the background and make it transparent" \
  --images photo.png

python scripts/edit_image.py "change the sky to sunset colors" \
  --images landscape.jpg \
  --output edited_landscape.png
```

**Multiple Image Support** (for consistency/reference):

```bash
python scripts/edit_image.py "create a collage combining these images" \
  --images img1.png img2.png img3.png \
  --aspect-ratio 16:9
```

**Parameters:**
- `prompt` (required): Text description of the edit
- `--images` (required): One or more input image paths
- `--output`: Output directory or file path (default: current directory)
- `--filename`: Custom filename (default: auto-generated)
- `--aspect-ratio`: Output aspect ratio (optional)
- `--model`: Model to use

## Supported Parameters

### Aspect Ratios
`1:1` | `2:3` | `3:2` | `3:4` | `4:3` | `4:5` | `5:4` | `9:16` | `16:9` | `21:9`

### Models
- `gemini-3-pro-image-preview` (default) - Nano Banana Pro: Higher quality, advanced reasoning, supports up to 14 reference images
- `gemini-2.5-flash-image` - Nano Banana: Faster generation, lower cost, good for quick iterations

## Usage Examples

**Generate a logo:**
```bash
python scripts/generate_image.py "minimalist tech company logo, blue gradient, modern" \
  --aspect-ratio 1:1 --filename logo.png
```

**Generate social media content:**
```bash
python scripts/generate_image.py "cozy coffee shop interior, warm lighting" \
  --aspect-ratio 9:16
```

**Edit a product photo:**
```bash
python scripts/edit_image.py "place this product on a wooden table with soft lighting" \
  --images product.png --aspect-ratio 4:3
```

**Quick iteration with Flash model:**
```bash
python scripts/generate_image.py "abstract art, vibrant colors" \
  --model gemini-2.5-flash-image
```

## Resources

### scripts/
- `generate_image.py` - Text-to-image generation script
- `edit_image.py` - Image editing with text prompts
- `requirements.txt` - Python dependencies (install with `pip install -r requirements.txt`)

### references/
- `api_reference.md` - Detailed API documentation, error codes, and troubleshooting

## Notes

- All generated images include SynthID watermarking (invisible, added by Gemini)
- Pro model supports up to 14 reference images for style/subject consistency
- Images are saved as JPEG by default (based on API response)
- Ensure dependencies are installed: `pip install -r scripts/requirements.txt`
