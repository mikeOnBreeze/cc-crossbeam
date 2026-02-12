---
name: fal-ai
description: This skill enables AI video generation from images AND text-to-speech voiceover generation using Fal.ai's API. Use this skill when the user asks to (1) generate videos from images (image-to-video), or (2) generate voiceovers/narration from text (text-to-speech via ElevenLabs). Works seamlessly with the nano-banana skill for image-to-video workflows. IMPORTANT: Check references/ for latest models and pricing - AI models change frequently.
---

# Fal.ai Media Generation

Generate AI videos from images and AI voiceovers from text using Fal.ai's API.

**Capabilities:**
- **Image-to-Video**: Generate video clips from static images (see below)
- **Text-to-Speech**: Generate voiceovers using ElevenLabs voices (see [TTS section](#text-to-speech-voiceovers))

## Prerequisites

This skill requires a `FAL_API_KEY` in the project's `.env` or `.env.local` file:

```env
FAL_API_KEY=your_api_key_here
```

To obtain an API key, visit: https://fal.ai/dashboard/keys

## Primary Capability: Image-to-Video

Generate video clips from static images using `scripts/image_to_video.py`:

```bash
python scripts/image_to_video.py image.png \
  --prompt "camera slowly pans right, gentle motion"
```

**Parameters:**
- `image` (required): Path to input image or URL
- `--prompt`, `-p`: Motion/action description for the video
- `--model`, `-m`: Video model to use (default: kling)
- `--output`, `-o`: Output directory or file path (default: current directory)
- `--duration`, `-d`: Video duration in seconds (model-dependent, typically 5-10)

## Model Selection Strategy

Video generation is expensive. Follow this workflow:

1. **Iterate with cheap models** (Wan/Kling) - Perfect your prompts at $0.05-0.07/sec
2. **Test with Veo Fast** - Verify quality improvement at $0.15/sec
3. **Final render with Veo Standard** - Premium output at $0.40/sec

## Quick Model Reference (January 2026)

| Flag | Model | Price/sec | 5-sec Cost | Best For |
|------|-------|-----------|------------|----------|
| `wan` | Wan 2.5 | $0.05 | $0.25 | Cheapest iteration |
| `kling` | Kling 2.5 Turbo Pro | $0.07 | $0.35 | **Best value** (default) |
| `veo-fast` | Veo 3.1 Fast | $0.15 | $0.75 | Quality test |
| `veo` | Veo 3.1 Standard | $0.40 | $2.00 | Premium final |

For detailed model comparison, strengths/weaknesses, and latest updates, see `references/api_reference.md`.

## Usage Examples

**Basic video generation (default Kling model):**
```bash
python scripts/image_to_video.py photo.png \
  --prompt "gentle breeze moves the leaves, soft lighting"
```

**Budget iteration with Wan:**
```bash
python scripts/image_to_video.py photo.png \
  --prompt "camera zooms in slowly" \
  --model wan
```

**Premium render with Veo:**
```bash
python scripts/image_to_video.py photo.png \
  --prompt "cinematic dolly shot, dramatic lighting" \
  --model veo \
  --output final_video.mp4
```

**Specify duration:**
```bash
python scripts/image_to_video.py photo.png \
  --prompt "waves crash on the shore" \
  --duration 10
```

## Workflow with Nano Banana

Generate an image, then create a video from it:

```bash
# Step 1: Generate image with Nano Banana
python .claude/skills/nano-banana/scripts/generate_image.py \
  "a serene Japanese garden with cherry blossoms" \
  --output garden.png

# Step 2: Iterate with Kling (default, $0.35 for 5 sec)
python skills/fal-ai/scripts/image_to_video.py \
  garden.png \
  --prompt "gentle breeze moves cherry blossom petals, camera slowly pans right"

# Step 3: Final render with Veo when satisfied ($2.00 for 5 sec)
python skills/fal-ai/scripts/image_to_video.py \
  garden.png \
  --prompt "gentle breeze moves cherry blossom petals, camera slowly pans right" \
  --model veo
```

---

## Text-to-Speech Voiceovers

Generate AI voiceovers using ElevenLabs voices via `scripts/text_to_speech.py`:

```bash
python scripts/text_to_speech.py "Your text here" --voice george
```

**Parameters:**
- `text` (required): Text to convert to speech
- `--voice`, `-v`: Voice name (see casting guide below)
- `--model`, `-m`: TTS model (default: eleven-v3)
- `--output`, `-o`: Output directory or file path
- `--stability`: Emotion control 0-1 (lower = more emotion)
- `--similarity`: Voice matching 0-1
- `--style`: Expression exaggeration 0-1
- `--speed`: Speaking pace 0.7-1.2
- `--list-voices`: Show all available voices

### TTS Model Reference (January 2026)

| Flag | Model | Price/1K chars | Best For |
|------|-------|----------------|----------|
| `eleven-v3` | ElevenLabs Eleven v3 | $0.10 | Latest, audio tags `[whispers]` etc. |
| `turbo` | ElevenLabs Turbo v2.5 | $0.05 | Fast iteration, low latency |
| `multilingual` | Multilingual v2 | $0.10 | Best stability |

### Voice Casting Quick Reference

When the user describes what they're looking for, match to these voices:

**Female Voices:**
| Voice | Best For |
|-------|----------|
| `rachel` | Narration, explainers, tutorials (calm, warm) |
| `aria` | Conversational, podcasts (engaging, social) |
| `sarah` | Corporate, professional (clear, neutral) |
| `laura` | Marketing, launches (upbeat, energetic) |
| `charlotte` | Premium brands (British, elegant) |
| `lily` | Wellness, calm content (soft, gentle) |

**Male Voices:**
| Voice | Best For |
|-------|----------|
| `george` | Documentaries, serious narration (British, authoritative) |
| `charlie` | Casual explainers (natural, relaxed) |
| `roger` | Trailers, announcements (deep, commanding) |
| `eric` | News-style, corporate (professional, clear) |
| `chris` | Brand voices, ads (warm, trustworthy) |
| `brian` | Educational, history (mature, wise) |

For full casting descriptions and parameter presets, see `references/tts_reference.md`.

### TTS Usage Examples

**Basic voiceover:**
```bash
python scripts/text_to_speech.py "Welcome to our product demo." --voice george
```

**Voice casting (run multiple to compare):**
```bash
TEXT="Introducing the future of productivity."
python scripts/text_to_speech.py "$TEXT" --voice george -o casting_george.mp3
python scripts/text_to_speech.py "$TEXT" --voice eric -o casting_eric.mp3
python scripts/text_to_speech.py "$TEXT" --voice chris -o casting_chris.mp3
```

**Documentary style (authoritative, slower):**
```bash
python scripts/text_to_speech.py "In the depths of the ocean..." \
  --voice george --stability 0.65 --speed 0.95
```

**Conversational style (more emotion):**
```bash
python scripts/text_to_speech.py "Hey, check this out!" \
  --voice aria --stability 0.4 --style 0.3
```

**With audio tags (eleven-v3 only):**
```bash
python scripts/text_to_speech.py "[whispers] This is a secret..." --voice rachel
```

---

## Resources

### scripts/
- `image_to_video.py` - Image-to-video generation script
- `text_to_speech.py` - Text-to-speech voiceover script
- `requirements.txt` - Python dependencies (install with `pip install -r requirements.txt`)

### references/
- `api_reference.md` - Video model comparison, pricing, best practices
- `tts_reference.md` - Voice casting guide, parameter presets, TTS best practices

## Notes

- **Models evolve rapidly**: Check reference docs dates. If >1 month old, research latest models on Fal.ai before generating
- **Video is expensive**: Always be aware of costs. Iterate cheap, render expensive.
- **TTS is cheap**: Run voice casting calls (~$0.02 for 3 samples) before committing to full narration
- **Queue-based API**: Generation takes time. Scripts show progress updates.
- **Output formats**: Videos = MP4, Audio = MP3
- **Duration limits**: Video models typically support 5-10 seconds. Check api_reference.md.
