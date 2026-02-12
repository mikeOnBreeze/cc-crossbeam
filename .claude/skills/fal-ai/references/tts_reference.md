# ElevenLabs TTS Voice Reference

**Last Updated:** January 23, 2026

**Note:** AI voice models and available voices evolve. If more than ~1 month has passed since the last update, research the latest at:
- ElevenLabs Voice Library: https://elevenlabs.io/voice-library
- fal.ai ElevenLabs Models: https://fal.ai/models?q=elevenlabs

## Quick Reference

| Model | Flag | Price/1K chars | Best For |
|-------|------|----------------|----------|
| ElevenLabs Eleven v3 | `eleven-v3` | $0.10 | Latest features, audio tags |
| ElevenLabs Turbo v2.5 | `turbo` | $0.05 | Fast iteration, low latency |
| ElevenLabs Multilingual v2 | `multilingual` | $0.10 | Best stability |

## Voice Casting Guide

Use this guide to match voices to your content needs. Think of it like a casting call.

### Female Voices

| Voice | Casting Description | Best For |
|-------|---------------------|----------|
| **Rachel** | Young American female, calm and warm, clear enunciation | Narration, explainers, tutorials, default choice |
| **Aria** | Expressive, engaging, social energy | Conversational content, podcasts, casual videos |
| **Sarah** | Clear, professional, neutral tone | Corporate content, business presentations |
| **Laura** | Upbeat, lively, energetic | Marketing, product launches, excitement |
| **Charlotte** | Refined British accent, elegant | Premium brands, sophisticated content |
| **Alice** | Confident, clear, assertive | Leadership content, instructions |
| **Matilda** | Warm, friendly, approachable | Customer-facing content, welcome messages |
| **Jessica** | Youthful, bright, enthusiastic | Youth-oriented content, apps |
| **Lily** | Soft, gentle, soothing | Meditation, wellness, ASMR-adjacent |

### Male Voices

| Voice | Casting Description | Best For |
|-------|---------------------|----------|
| **George** | Middle-aged British, raspy, authoritative | Documentaries, serious narration, gravitas |
| **Charlie** | Natural, conversational, relaxed | Casual content, friendly explainers |
| **Roger** | Deep, resonant, commanding | Trailers, announcements, authority |
| **Callum** | Young British, articulate | Tech content, younger demographic |
| **River** | Calm, measured, thoughtful | Meditation, thoughtful content |
| **Liam** | Friendly, approachable, everyman | General narration, tutorials |
| **Will** | Energetic, dynamic, excited | Sports, action, high-energy content |
| **Eric** | Professional, clear, broadcast quality | News-style, corporate |
| **Chris** | Warm baritone, trustworthy | Brand voices, advertisements |
| **Brian** | Mature, experienced, wise | Educational content, history |
| **Daniel** | Articulate British, precise | Academic, technical content |
| **Bill** | Older, wise, grandfather-like | Storytelling, heritage brands |

## Voice Casting by Use Case

### Tech Demo / Product Launch
- **Confident male**: George (authoritative), Eric (professional), Chris (trustworthy)
- **Confident female**: Alice (assertive), Sarah (professional), Charlotte (premium)
- **Energetic**: Will (dynamic), Laura (upbeat)

### Documentary / Narration
- **Male**: George (classic narrator), Brian (mature), Daniel (academic)
- **Female**: Rachel (warm narrator), Aria (engaging)

### Tutorial / Explainer
- **Male**: Charlie (friendly), Liam (approachable), Callum (tech-savvy)
- **Female**: Rachel (clear), Matilda (warm), Sarah (professional)

### Conversational / Casual
- **Male**: Charlie (relaxed), Liam (friendly)
- **Female**: Aria (social), Matilda (warm), Jessica (youthful)

### Premium / Luxury Brand
- **Male**: George (refined), Roger (commanding), Daniel (articulate)
- **Female**: Charlotte (elegant), Alice (confident)

### Calm / Wellness
- **Male**: River (measured), Charlie (relaxed)
- **Female**: Lily (gentle), Rachel (calm)

## Voice Parameters Explained

### Stability (0-1, default: 0.5)
Controls emotional consistency vs. variation.

| Setting | Effect | Use When |
|---------|--------|----------|
| 0.3-0.4 | High emotion, performative | Dramatic content, storytelling |
| 0.45-0.55 | Balanced | Most content (default) |
| 0.6-0.7 | More consistent, professional | Corporate, serious content |
| 0.8+ | Near-monotone | Technical readouts, data |

### Similarity Boost (0-1, default: 0.75)
How closely the output matches the voice's original character.

| Setting | Effect | Use When |
|---------|--------|----------|
| 0.5-0.6 | More AI interpretation | Creative variation |
| 0.7-0.8 | Balanced (recommended) | Most content |
| 0.85+ | Strict voice matching | Brand consistency (risk: may reproduce artifacts) |

### Style (0-1, default: 0)
Expression exaggeration. Only supported in Eleven v3.

| Setting | Effect | Use When |
|---------|--------|----------|
| 0 | Neutral delivery | Professional, serious |
| 0.2-0.3 | Subtle expression | Conversational |
| 0.4-0.6 | Noticeable drama | Storytelling, engagement |
| 0.7+ | Highly theatrical | Dramatic scenes only |

### Speed (0.7-1.2, default: 1.0)

| Setting | Effect | Use When |
|---------|--------|----------|
| 0.7-0.85 | Slower, deliberate | Complex topics, gravitas |
| 0.9-1.0 | Natural pace | Most content |
| 1.05-1.1 | Slightly faster | Casual, energetic |
| 1.15-1.2 | Fast | Urgent, excited (use sparingly) |

## Preset Combinations

### Documentary Narrator
```bash
--voice george --stability 0.65 --similarity 0.75 --style 0.1 --speed 0.95
```

### Conversational Explainer
```bash
--voice aria --stability 0.45 --similarity 0.75 --style 0.25 --speed 1.0
```

### Professional Corporate
```bash
--voice sarah --stability 0.6 --similarity 0.8 --style 0 --speed 1.0
```

### Energetic Product Launch
```bash
--voice laura --stability 0.4 --similarity 0.75 --style 0.4 --speed 1.05
```

### Calm Meditation
```bash
--voice river --stability 0.7 --similarity 0.75 --style 0 --speed 0.85
```

## Audio Tags (Eleven v3 Only)

Embed emotional direction inline in your text:

```
[whispers] This is a secret...
[laughs] That's hilarious!
[sarcastic] Oh, what a great idea.
[curious] I wonder what this does?
[nervously] I'm not sure about this...
```

**Available tags:** `[whispers]`, `[shouts]`, `[laughs]`, `[sarcastic]`, `[curious]`, `[nervously]`, `[excitedly]`, `[sadly]`

Tag effectiveness varies by voice. Test with short clips first.

## Text Formatting Best Practices

### Pauses
- **Ellipsis (...)**: Natural hesitation pause
- **Em dash (—)**: Abrupt break, thought shift
- **Period + new sentence**: Standard pause
- Avoid excessive `<break>` tags (causes instability)

### Pronunciation
- Spell out numbers: "twenty-three" not "23"
- Expand abbreviations: "Doctor Smith" not "Dr. Smith"
- Dates in full: "January twenty-third" not "1/23"
- Currency: "forty-two dollars" not "$42"

### Structure
- Complete sentences with proper punctuation
- Break long passages into paragraphs
- One thought per sentence for clarity

## Workflow: Voice Casting

Since TTS is cheap (~$0.10/1K chars), run a casting call:

1. **Write a sample sentence** (10-20 words) that represents your content
2. **Pick 3 candidate voices** based on casting descriptions above
3. **Generate samples** for each voice
4. **Listen and compare**
5. **Pick winner, then generate full content**

Example casting call:
```bash
# Sample text
TEXT="Welcome to the future of productivity. Let me show you what's possible."

# Try 3 voices
python text_to_speech.py "$TEXT" --voice george -o casting_george.mp3
python text_to_speech.py "$TEXT" --voice eric -o casting_eric.mp3
python text_to_speech.py "$TEXT" --voice chris -o casting_chris.mp3
```

Total cost for 3 samples: ~$0.02

## Cost Calculator

| Content Type | Typical Length | Cost @ $0.10/1K |
|--------------|----------------|-----------------|
| Single sentence | 100 chars | $0.01 |
| Short paragraph | 500 chars | $0.05 |
| Product description | 1,000 chars | $0.10 |
| Blog post narration | 5,000 chars | $0.50 |
| Full article | 10,000 chars | $1.00 |

For iteration, use `turbo` model at $0.05/1K (half price).

## API Documentation

- fal.ai ElevenLabs Docs: https://fal.ai/models/fal-ai/elevenlabs/tts/eleven-v3/api
- ElevenLabs Voice Library: https://elevenlabs.io/voice-library
- ElevenLabs Best Practices: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
- fal.ai Pricing: https://fal.ai/pricing

## Changelog

### January 23, 2026
- Initial TTS reference created
- Documented 21 ElevenLabs voices with casting descriptions
- Added parameter presets for common use cases
- Included audio tags reference for Eleven v3
