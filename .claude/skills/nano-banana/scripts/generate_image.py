#!/usr/bin/env python3
"""
Generate images from text prompts using Google Gemini's Nano Banana models.

Usage:
    python generate_image.py "your prompt here" [options]

Example:
    python generate_image.py "a sunset over mountains" --aspect-ratio 16:9
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ Error: google-genai package not installed.")
    print("   Run: pip install google-genai")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
    # Also try .env.local
    env_local = Path(".env.local")
    if env_local.exists():
        load_dotenv(env_local)
except ImportError:
    pass  # dotenv is optional, fall back to os.environ

VALID_ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]
VALID_MODELS = ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"]
DEFAULT_MODEL = "gemini-3-pro-image-preview"


def get_api_key():
    """Get API key from environment."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment.")
        print("   Add it to your .env file:")
        print("   GEMINI_API_KEY=your_api_key_here")
        print("")
        print("   Get an API key at: https://aistudio.google.com/apikey")
        sys.exit(1)
    return api_key


def generate_filename(extension=".jpg"):
    """Generate a unique filename with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"generated_{timestamp}{extension}"


def save_image(image_data: bytes, output_path: Path) -> Path:
    """Save image data to file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image_data)
    return output_path


def build_prompt_with_aspect(prompt: str, aspect_ratio: str) -> str:
    """
    Build a prompt that includes aspect ratio guidance.

    The Nano Banana model responds to aspect ratio hints in the prompt.
    """
    aspect_descriptions = {
        "1:1": "square format",
        "2:3": "vertical portrait format (2:3)",
        "3:2": "horizontal landscape format (3:2)",
        "3:4": "vertical portrait format (3:4)",
        "4:3": "horizontal format (4:3)",
        "4:5": "vertical format (4:5)",
        "5:4": "horizontal format (5:4)",
        "9:16": "tall vertical format (9:16, phone/stories)",
        "16:9": "widescreen horizontal format (16:9)",
        "21:9": "ultra-wide cinematic format (21:9)"
    }

    aspect_hint = aspect_descriptions.get(aspect_ratio, f"{aspect_ratio} aspect ratio")

    # Add aspect ratio to prompt if not already mentioned
    if "aspect" not in prompt.lower() and "ratio" not in prompt.lower() and "format" not in prompt.lower():
        return f"Generate an image in {aspect_hint}. {prompt}"
    return prompt


def generate_image(
    prompt: str,
    output: str = ".",
    filename: str = None,
    aspect_ratio: str = "1:1",
    model: str = DEFAULT_MODEL,
) -> Path:
    """
    Generate an image from a text prompt.

    Args:
        prompt: Text description of the image to generate
        output: Output directory or file path
        filename: Custom filename (optional)
        aspect_ratio: Image aspect ratio (e.g., "16:9")
        model: Gemini model to use

    Returns:
        Path to the generated image
    """
    # Validate parameters
    if aspect_ratio not in VALID_ASPECT_RATIOS:
        print(f"❌ Error: Invalid aspect ratio '{aspect_ratio}'")
        print(f"   Valid options: {', '.join(VALID_ASPECT_RATIOS)}")
        sys.exit(1)

    if model not in VALID_MODELS:
        print(f"❌ Error: Invalid model '{model}'")
        print(f"   Valid options: {', '.join(VALID_MODELS)}")
        sys.exit(1)

    # Determine output path
    output_path = Path(output)
    if output_path.is_dir() or not output_path.suffix:
        # Output is a directory
        output_path.mkdir(parents=True, exist_ok=True)
        fname = filename if filename else generate_filename()
        output_path = output_path / fname
    else:
        # Output is a file path
        if filename:
            output_path = output_path.parent / filename

    # Ensure image extension
    if output_path.suffix.lower() not in [".png", ".jpg", ".jpeg", ".webp"]:
        output_path = output_path.with_suffix(".jpg")

    # Build prompt with aspect ratio hint
    full_prompt = build_prompt_with_aspect(prompt, aspect_ratio)

    print(f"🎨 Generating image...")
    print(f"   Prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
    print(f"   Model: {model}")
    print(f"   Aspect Ratio: {aspect_ratio}")

    # Initialize client
    api_key = get_api_key()
    client = genai.Client(api_key=api_key)

    # Configure generation
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"]
    )

    try:
        # Generate image
        response = client.models.generate_content(
            model=model,
            contents=full_prompt,
            config=config
        )

        # Extract image from response
        if not response.candidates:
            print("❌ Error: No image generated. The prompt may have been blocked.")
            sys.exit(1)

        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            print("❌ Error: No image data in response.")
            sys.exit(1)

        # Find image part
        image_part = None
        for part in candidate.content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                image_part = part
                break

        if not image_part:
            print("❌ Error: No image found in response.")
            # Check if there's text (might be an error message)
            for part in candidate.content.parts:
                if hasattr(part, "text") and part.text:
                    print(f"   Response: {part.text}")
            sys.exit(1)

        # Get image data (already raw bytes from the API)
        image_data = image_part.inline_data.data

        # Determine extension from MIME type
        mime_type = image_part.inline_data.mime_type
        if mime_type == "image/png":
            if output_path.suffix.lower() != ".png":
                output_path = output_path.with_suffix(".png")
        elif mime_type in ["image/jpeg", "image/jpg"]:
            if output_path.suffix.lower() not in [".jpg", ".jpeg"]:
                output_path = output_path.with_suffix(".jpg")
        elif mime_type == "image/webp":
            if output_path.suffix.lower() != ".webp":
                output_path = output_path.with_suffix(".webp")

        saved_path = save_image(image_data, output_path)

        print(f"✅ Image saved to: {saved_path.absolute()}")
        return saved_path

    except Exception as e:
        print(f"❌ Error generating image: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate images from text prompts using Gemini Nano Banana",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_image.py "a sunset over mountains"
  python generate_image.py "minimalist logo" --aspect-ratio 1:1
  python generate_image.py "landscape photo" --output ./images/ --filename landscape.jpg
  python generate_image.py "quick sketch" --model gemini-2.5-flash-image
        """
    )

    parser.add_argument(
        "prompt",
        help="Text description of the image to generate"
    )
    parser.add_argument(
        "--output", "-o",
        default=".",
        help="Output directory or file path (default: current directory)"
    )
    parser.add_argument(
        "--filename", "-f",
        help="Custom filename for the generated image"
    )
    parser.add_argument(
        "--aspect-ratio", "-a",
        default="1:1",
        choices=VALID_ASPECT_RATIOS,
        help="Image aspect ratio (default: 1:1)"
    )
    parser.add_argument(
        "--model", "-m",
        default=DEFAULT_MODEL,
        choices=VALID_MODELS,
        help=f"Gemini model to use (default: {DEFAULT_MODEL})"
    )

    args = parser.parse_args()

    generate_image(
        prompt=args.prompt,
        output=args.output,
        filename=args.filename,
        aspect_ratio=args.aspect_ratio,
        model=args.model
    )


if __name__ == "__main__":
    main()
