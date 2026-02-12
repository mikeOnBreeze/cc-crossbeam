#!/usr/bin/env python3
"""
Generate speech audio from text using Fal.ai's ElevenLabs TTS API.

Usage:
    python text_to_speech.py "Your text here" --voice rachel

Example:
    python text_to_speech.py "Welcome to our product demo." --voice george --model eleven-v3
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import fal_client
except ImportError:
    print("Error: fal-client package not installed.")
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

# ElevenLabs Model configurations (as of January 23, 2026)
MODELS = {
    "eleven-v3": {
        "endpoint": "fal-ai/elevenlabs/tts/eleven-v3",
        "name": "ElevenLabs Eleven v3",
        "price_per_1k_chars": 0.10,
        "description": "Latest model, supports audio tags [whispers], [laughs], etc."
    },
    "turbo": {
        "endpoint": "fal-ai/elevenlabs/tts/turbo-v2.5",
        "name": "ElevenLabs Turbo v2.5",
        "price_per_1k_chars": 0.05,
        "description": "Fastest, lowest latency, 32 languages"
    },
    "multilingual": {
        "endpoint": "fal-ai/elevenlabs/tts/multilingual-v2",
        "name": "ElevenLabs Multilingual v2",
        "price_per_1k_chars": 0.10,
        "description": "Best stability, 29 languages"
    },
}

# ElevenLabs voices with casting descriptions
# See references/tts_reference.md for full casting guide
VOICES = {
    # Female voices
    "rachel": "Young American female, calm and warm. Great for narration, explainers.",
    "aria": "Expressive female, engaging and social. Good for conversational content.",
    "sarah": "Female, clear and professional.",
    "laura": "Female, upbeat and lively. Good for energetic content.",
    "charlotte": "Female, refined British accent.",
    "alice": "Female, confident and clear.",
    "matilda": "Female, warm and friendly.",
    "jessica": "Female, youthful and bright.",
    "lily": "Female, soft and gentle.",
    # Male voices
    "george": "Middle-aged British male, raspy and authoritative. Excellent for documentaries.",
    "charlie": "Male, natural and conversational. Relaxed tone.",
    "roger": "Male, deep and resonant.",
    "callum": "Male, young British accent.",
    "river": "Male, calm and measured.",
    "liam": "Male, friendly and approachable.",
    "will": "Male, energetic and dynamic.",
    "eric": "Male, professional and clear.",
    "chris": "Male, warm baritone.",
    "brian": "Male, mature and trustworthy.",
    "daniel": "Male, articulate British accent.",
    "bill": "Male, older and wise-sounding.",
}


def get_api_key():
    """Get API key from environment and set FAL_KEY for fal_client."""
    api_key = os.environ.get("FAL_API_KEY")
    if not api_key:
        print("Error: FAL_API_KEY not found in environment.")
        print("   Add it to your .env file:")
        print("   FAL_API_KEY=your_api_key_here")
        print("")
        print("   Get an API key at: https://fal.ai/dashboard/keys")
        sys.exit(1)
    # Set FAL_KEY for fal_client library
    os.environ["FAL_KEY"] = api_key
    return api_key


def generate_filename(extension=".mp3"):
    """Generate a unique filename with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"audio_{timestamp}{extension}"


def list_voices():
    """Print available voices with descriptions."""
    print("\nAvailable ElevenLabs Voices:")
    print("-" * 70)
    print("\nFemale Voices:")
    for voice, desc in VOICES.items():
        if "female" in desc.lower() or voice in ["rachel", "aria", "sarah", "laura", "charlotte", "alice", "matilda", "jessica", "lily"]:
            print(f"  {voice:12} - {desc}")
    print("\nMale Voices:")
    for voice, desc in VOICES.items():
        if "male" in desc.lower() and "female" not in desc.lower():
            print(f"  {voice:12} - {desc}")
    print("\nFor full casting guide, see: references/tts_reference.md")


def on_queue_update(update):
    """Handle queue status updates."""
    if hasattr(update, 'status'):
        status = update.status
        if status == "IN_QUEUE":
            pos = getattr(update, 'position', '?')
            print(f"   Queue position: {pos}")
        elif status == "IN_PROGRESS":
            print("   Generating audio...")


def generate_speech(
    text: str,
    voice: str = "rachel",
    model: str = "eleven-v3",
    output: str = ".",
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.0,
    speed: float = 1.0,
) -> Path:
    """
    Generate speech audio from text.

    Args:
        text: Text to convert to speech
        voice: Voice name (e.g., "rachel", "george")
        model: TTS model to use
        output: Output directory or file path
        stability: Voice consistency (0-1, lower = more emotion)
        similarity_boost: Voice character matching (0-1)
        style: Expression exaggeration (0-1)
        speed: Speaking pace (0.7-1.2)

    Returns:
        Path to the generated audio file
    """
    # Validate model
    if model not in MODELS:
        print(f"Error: Invalid model '{model}'")
        print(f"   Valid options: {', '.join(MODELS.keys())}")
        sys.exit(1)

    # Validate voice
    voice_lower = voice.lower()
    if voice_lower not in VOICES:
        print(f"Error: Invalid voice '{voice}'")
        list_voices()
        sys.exit(1)

    model_config = MODELS[model]

    # Determine output path
    output_path = Path(output)
    if output_path.is_dir() or not output_path.suffix:
        output_path.mkdir(parents=True, exist_ok=True)
        output_path = output_path / generate_filename()
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)

    # Ensure mp3 extension
    if output_path.suffix.lower() != ".mp3":
        output_path = output_path.with_suffix(".mp3")

    # Configure API key BEFORE any fal_client calls
    get_api_key()

    # Estimate cost
    char_count = len(text)
    est_cost = (char_count / 1000) * model_config["price_per_1k_chars"]

    print(f"Generating speech...")
    print(f"   Model: {model_config['name']} ({model})")
    print(f"   Voice: {voice_lower.capitalize()}")
    print(f"   Text: {text[:60]}{'...' if len(text) > 60 else ''}")
    print(f"   Characters: {char_count}")
    print(f"   Estimated cost: ${est_cost:.4f}")
    print(f"   Settings: stability={stability}, similarity={similarity_boost}, style={style}, speed={speed}")

    # Build arguments
    arguments = {
        "text": text,
        "voice": voice_lower.capitalize(),  # ElevenLabs expects capitalized names
        "stability": stability,
        "similarity_boost": similarity_boost,
        "speed": speed,
    }

    # Style is only meaningful if > 0
    if style > 0:
        arguments["style"] = style

    try:
        # Generate audio using queue-based API
        result = fal_client.subscribe(
            model_config["endpoint"],
            arguments=arguments,
            with_logs=True,
            on_queue_update=on_queue_update,
        )

        # Extract audio URL from result
        audio_url = None
        if isinstance(result, dict):
            # Try common response formats
            if "audio" in result:
                audio_data = result["audio"]
                if isinstance(audio_data, dict):
                    audio_url = audio_data.get("url")
                else:
                    audio_url = audio_data
            elif "audio_url" in result:
                audio_url = result["audio_url"]
            elif "url" in result:
                audio_url = result["url"]

        if not audio_url:
            print("Error: No audio URL in response.")
            print(f"   Response: {result}")
            sys.exit(1)

        # Download audio
        print(f"Downloading audio...")
        import urllib.request
        urllib.request.urlretrieve(audio_url, str(output_path))

        print(f"Audio saved to: {output_path.absolute()}")
        return output_path

    except Exception as e:
        print(f"Error generating audio: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate speech from text using ElevenLabs via Fal.ai",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Models (as of January 2026):
  eleven-v3     ElevenLabs Eleven v3   $0.10/1K chars  Latest, audio tags support
  turbo         ElevenLabs Turbo v2.5  $0.05/1K chars  Fastest, low latency
  multilingual  Multilingual v2        $0.10/1K chars  Best stability

Voice Parameters:
  --stability       0-1 (default 0.5)  Lower = more emotion, Higher = monotone
  --similarity      0-1 (default 0.75) Voice character matching
  --style           0-1 (default 0)    Expression exaggeration
  --speed           0.7-1.2 (default 1.0) Speaking pace

Examples:
  python text_to_speech.py "Hello world" --voice rachel
  python text_to_speech.py "Welcome to our demo." --voice george --model eleven-v3
  python text_to_speech.py "Breaking news!" --voice aria --stability 0.3 --style 0.5
  python text_to_speech.py --list-voices
        """
    )

    parser.add_argument(
        "text",
        nargs="?",
        help="Text to convert to speech"
    )
    parser.add_argument(
        "--voice", "-v",
        default="rachel",
        help="Voice to use (default: rachel). Use --list-voices to see options."
    )
    parser.add_argument(
        "--model", "-m",
        default="eleven-v3",
        choices=list(MODELS.keys()),
        help="TTS model to use (default: eleven-v3)"
    )
    parser.add_argument(
        "--output", "-o",
        default=".",
        help="Output directory or file path (default: current directory)"
    )
    parser.add_argument(
        "--stability",
        type=float,
        default=0.5,
        help="Voice consistency 0-1 (default: 0.5). Lower = more emotion."
    )
    parser.add_argument(
        "--similarity",
        type=float,
        default=0.75,
        help="Voice character matching 0-1 (default: 0.75)"
    )
    parser.add_argument(
        "--style",
        type=float,
        default=0.0,
        help="Expression exaggeration 0-1 (default: 0)"
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=1.0,
        help="Speaking pace 0.7-1.2 (default: 1.0)"
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="List available voices and exit"
    )

    args = parser.parse_args()

    if args.list_voices:
        list_voices()
        sys.exit(0)

    if not args.text:
        parser.print_help()
        print("\nError: Text argument is required (unless using --list-voices)")
        sys.exit(1)

    generate_speech(
        text=args.text,
        voice=args.voice,
        model=args.model,
        output=args.output,
        stability=args.stability,
        similarity_boost=args.similarity,
        style=args.style,
        speed=args.speed,
    )


if __name__ == "__main__":
    main()
