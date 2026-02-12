#!/usr/bin/env python3
"""
Generate videos from images using Fal.ai's video generation API.

Usage:
    python image_to_video.py image.png --prompt "description of motion"

Example:
    python image_to_video.py photo.png --prompt "gentle breeze moves the leaves" --model kling
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import fal_client
except ImportError:
    print("❌ Error: fal-client package not installed.")
    print("   Run: pip install fal-client")
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

# Model configurations (as of January 22, 2026)
MODELS = {
    "wan": {
        "endpoint": "fal-ai/wan/v2.6/image-to-video",
        "name": "Wan 2.6",
        "price_per_sec": 0.05,
        "description": "Cheapest option, fast iterations"
    },
    "kling": {
        "endpoint": "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
        "name": "Kling 2.5 Turbo Pro",
        "price_per_sec": 0.07,
        "description": "Best value, great quality"
    },
    "kling3": {
        "endpoint": "fal-ai/kling-video/v3/pro/image-to-video",
        "name": "Kling 3.0 Pro",
        "price_per_sec": 0.10,
        "description": "Latest Kling, best motion quality (default)"
    },
    "veo-fast": {
        "endpoint": "fal-ai/veo3/image-to-video",  # Fast variant
        "name": "Veo 3.1 Fast",
        "price_per_sec": 0.15,
        "description": "Good quality at half Veo price"
    },
    "veo": {
        "endpoint": "fal-ai/veo3/image-to-video",  # Standard variant
        "name": "Veo 3.1 Standard",
        "price_per_sec": 0.40,
        "description": "Premium quality, final renders"
    },
    "minimax": {
        "endpoint": "fal-ai/minimax/video-01-live/image-to-video",
        "name": "MiniMax Hailuo",
        "price_per_sec": 0.10,
        "description": "Budget-friendly, decent quality"
    },
    "luma": {
        "endpoint": "fal-ai/luma-dream-machine/image-to-video",
        "name": "Luma Dream Machine",
        "price_per_sec": 0.15,
        "description": "Good for product demos, camera movements"
    }
}

DEFAULT_MODEL = "kling3"


def get_api_key():
    """Get API key from environment and set FAL_KEY for fal_client."""
    api_key = os.environ.get("FAL_API_KEY")
    if not api_key:
        print("❌ Error: FAL_API_KEY not found in environment.")
        print("   Add it to your .env file:")
        print("   FAL_API_KEY=your_api_key_here")
        print("")
        print("   Get an API key at: https://fal.ai/dashboard/keys")
        sys.exit(1)
    # Set FAL_KEY for fal_client library
    os.environ["FAL_KEY"] = api_key
    return api_key


def generate_filename(extension=".mp4"):
    """Generate a unique filename with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"video_{timestamp}{extension}"


def upload_image_if_local(image_path: str) -> str:
    """Upload local image to Fal CDN if it's a local file, otherwise return URL as-is."""
    if image_path.startswith(("http://", "https://")):
        return image_path

    path = Path(image_path)
    if not path.exists():
        print(f"❌ Error: Image file not found: {image_path}")
        sys.exit(1)

    print(f"📤 Uploading image to Fal CDN...")
    try:
        url = fal_client.upload_file(str(path))
        print(f"   Uploaded: {url[:60]}...")
        return url
    except Exception as e:
        print(f"❌ Error uploading image: {e}")
        sys.exit(1)


def on_queue_update(update):
    """Handle queue status updates."""
    if hasattr(update, 'status'):
        status = update.status
        if status == "IN_QUEUE":
            pos = getattr(update, 'position', '?')
            print(f"   Queue position: {pos}")
        elif status == "IN_PROGRESS":
            print("   Generating video...")
            if hasattr(update, 'logs') and update.logs:
                for log in update.logs:
                    if hasattr(log, 'message'):
                        print(f"   {log.message}")


def generate_video(
    image: str,
    prompt: str = "",
    model: str = DEFAULT_MODEL,
    output: str = ".",
    duration: int = None,
) -> Path:
    """
    Generate a video from an image.

    Args:
        image: Path to input image or URL
        prompt: Motion/action description
        model: Video model to use
        output: Output directory or file path
        duration: Video duration in seconds (optional)

    Returns:
        Path to the generated video
    """
    # Validate model
    if model not in MODELS:
        print(f"❌ Error: Invalid model '{model}'")
        print(f"   Valid options: {', '.join(MODELS.keys())}")
        sys.exit(1)

    model_config = MODELS[model]

    # Determine output path
    output_path = Path(output)
    if output_path.is_dir() or not output_path.suffix:
        output_path.mkdir(parents=True, exist_ok=True)
        output_path = output_path / generate_filename()
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)

    # Ensure mp4 extension
    if output_path.suffix.lower() != ".mp4":
        output_path = output_path.with_suffix(".mp4")

    # Configure API key BEFORE any fal_client calls
    get_api_key()

    # Upload image if local
    image_url = upload_image_if_local(image)

    # Estimate cost
    est_duration = duration if duration else 5
    est_cost = est_duration * model_config["price_per_sec"]

    print(f"🎬 Generating video...")
    print(f"   Model: {model_config['name']} ({model})")
    print(f"   Prompt: {prompt[:80]}{'...' if len(prompt) > 80 else ''}" if prompt else "   Prompt: (none)")
    print(f"   Estimated cost: ${est_cost:.2f} ({est_duration}s @ ${model_config['price_per_sec']}/sec)")

    # Build arguments
    arguments = {
        "image_url": image_url,
    }

    if prompt:
        arguments["prompt"] = prompt

    if duration:
        arguments["duration"] = duration

    try:
        # Generate video using queue-based API
        result = fal_client.subscribe(
            model_config["endpoint"],
            arguments=arguments,
            with_logs=True,
            on_queue_update=on_queue_update,
        )

        # Extract video URL from result
        video_url = None
        if isinstance(result, dict):
            # Try common response formats
            if "video" in result:
                video_data = result["video"]
                if isinstance(video_data, dict):
                    video_url = video_data.get("url")
                else:
                    video_url = video_data
            elif "video_url" in result:
                video_url = result["video_url"]
            elif "output" in result:
                output_data = result["output"]
                if isinstance(output_data, dict):
                    video_url = output_data.get("video", {}).get("url") or output_data.get("url")
                elif isinstance(output_data, str):
                    video_url = output_data

        if not video_url:
            print("❌ Error: No video URL in response.")
            print(f"   Response: {result}")
            sys.exit(1)

        # Download video
        print(f"📥 Downloading video...")
        import urllib.request
        urllib.request.urlretrieve(video_url, str(output_path))

        print(f"✅ Video saved to: {output_path.absolute()}")
        return output_path

    except Exception as e:
        print(f"❌ Error generating video: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate videos from images using Fal.ai",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Models (as of January 2026):
  wan        Wan 2.5         $0.05/sec  Cheapest, fast iterations
  kling      Kling 2.5       $0.07/sec  Best value (default)
  veo-fast   Veo 3.1 Fast    $0.15/sec  Good quality, half Veo price
  veo        Veo 3.1         $0.40/sec  Premium quality, final renders
  minimax    MiniMax Hailuo  $0.10/sec  Budget-friendly
  luma       Luma Dream      $0.15/sec  Product demos, camera work

Examples:
  python image_to_video.py photo.png --prompt "gentle motion"
  python image_to_video.py photo.png --prompt "zoom in" --model wan
  python image_to_video.py photo.png --prompt "cinematic" --model veo -o final.mp4
        """
    )

    parser.add_argument(
        "image",
        help="Path to input image or URL"
    )
    parser.add_argument(
        "--prompt", "-p",
        default="",
        help="Motion/action description for the video"
    )
    parser.add_argument(
        "--model", "-m",
        default=DEFAULT_MODEL,
        choices=list(MODELS.keys()),
        help=f"Video model to use (default: {DEFAULT_MODEL})"
    )
    parser.add_argument(
        "--output", "-o",
        default=".",
        help="Output directory or file path (default: current directory)"
    )
    parser.add_argument(
        "--duration", "-d",
        type=int,
        help="Video duration in seconds (model-dependent, typically 5-10)"
    )

    args = parser.parse_args()

    generate_video(
        image=args.image,
        prompt=args.prompt,
        model=args.model,
        output=args.output,
        duration=args.duration,
    )


if __name__ == "__main__":
    main()
