# Fal.ai Video Model Reference

**Last Updated:** January 22, 2026

**Note:** AI video models evolve rapidly. If more than ~1 month has passed since the last update, run research on Fal.ai (https://fal.ai/models?categories=video) to check for new models before generating videos.

## Core Models Quick Reference

| Model | Flag | Price/sec | 5-sec Cost | Use Case |
|-------|------|-----------|------------|----------|
| Wan 2.5 | `wan` | $0.05 | $0.25 | Cheapest, fast iterations |
| Kling 2.5 Turbo Pro | `kling` | $0.07 | $0.35 | **Best value** (default) |
| Veo 3.1 Fast | `veo-fast` | $0.15 | $0.75 | Quality test before final |
| Veo 3.1 Standard | `veo` | $0.40 | $2.00 | Premium final renders |

## Model Selection Decision Tree

```
Need to generate a video?
│
├─ Iterating on prompts? ──────────────► Wan ($0.05/sec) or Kling ($0.07/sec)
│
├─ Testing quality before final? ──────► Veo Fast ($0.15/sec)
│
├─ Final premium render? ──────────────► Veo Standard ($0.40/sec)
│
├─ Product demo / camera work? ────────► Luma Dream Machine ($0.15/sec)
│
└─ Stylized / artistic? ───────────────► PixVerse or MiniMax
```

## Detailed Model Comparison

### Tier 1: Budget / Iteration Models

#### Wan 2.5/2.6
- **Endpoint:** `fal-ai/wan/v2.6/image-to-video`
- **Price:** $0.05/second (~$0.25 for 5s video)
- **Strengths:**
  - Cheapest option available
  - Fast generation times
  - Good for rapid iteration
- **Weaknesses:**
  - Lower quality than premium models
  - Less consistent motion physics
- **Best for:** First drafts, prompt iteration, high-volume testing

#### Kling 2.5 Turbo Pro
- **Endpoint:** `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`
- **Price:** $0.07/second (~$0.35 for 5s video)
- **Strengths:**
  - Best value for quality/price ratio
  - Excellent motion fluidity
  - Good character consistency
  - Fast generation
- **Weaknesses:**
  - Not as cinematic as Veo
- **Best for:** Default choice, good quality at reasonable price

### Tier 2: Mid-Range Models

#### MiniMax Hailuo 2.3
- **Endpoint:** `fal-ai/minimax/video-01-live/image-to-video`
- **Price:** ~$0.10/video
- **Strengths:**
  - Style diversity (anime, realistic, ink painting)
  - Improved camera control
  - Good motion physics
- **Weaknesses:**
  - Results can look "clearly AI"
- **Best for:** Stylized content, animation

#### Luma Dream Machine v1.5
- **Endpoint:** `fal-ai/luma-dream-machine/image-to-video`
- **Price:** ~$0.15/video
- **Strengths:**
  - Excellent for product demos
  - Great camera movements
  - Object-centric generation
- **Weaknesses:**
  - Can struggle with complex scenes
- **Best for:** Product videos, camera movements, character animations

#### Veo 3.1 Fast
- **Endpoint:** `fal-ai/veo3/image-to-video` (fast variant)
- **Price:** $0.15/second (~$0.75 for 5s video)
- **Strengths:**
  - Half the price of standard Veo
  - Good quality for testing
  - Faster generation
- **Weaknesses:**
  - Not as polished as standard Veo
- **Best for:** Quality verification before final render

### Tier 3: Premium Models

#### Veo 3.1 Standard (Google)
- **Endpoint:** `fal-ai/veo3/image-to-video` (standard variant)
- **Price:** $0.40/second (~$2.00 for 5s video)
- **Strengths:**
  - Highest quality output
  - Best cinematic results
  - Native audio generation
  - Excellent text rendering
  - Superior motion physics
- **Weaknesses:**
  - Most expensive option
  - Slower generation
- **Best for:** Final renders, professional output, marketing content

#### Kling 2.6 Master
- **Endpoint:** `fal-ai/kling-video/v2.6/master/image-to-video`
- **Price:** Premium (varies)
- **Strengths:**
  - Native audio generation
  - Motion control/transfer
  - High-quality motion
- **Weaknesses:**
  - Higher cost than Kling 2.5
- **Best for:** When audio sync is needed, motion transfer

### Other Available Models

#### PixVerse v4.5
- **Endpoint:** `fal-ai/pixverse/v4.5/image-to-video`
- **Price:** ~$0.10/video
- **Best for:** Stylized, artistic transformations

#### Hunyuan Video 1.5
- **Endpoint:** `fal-ai/hunyuan-video-v1.5/image-to-video`
- **Price:** ~$0.40/video
- **Best for:** Open model alternative, Tencent's offering

#### LTX-2 19B
- **Endpoint:** `fal-ai/ltx-2-19b/image-to-video`
- **Price:** Varies
- **Best for:** Video with audio, supports custom LoRA

## Common Parameters

Most image-to-video models accept these parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `image_url` | string | URL of the source image (required) |
| `prompt` | string | Motion/action description |
| `duration` | int | Video length in seconds (typically 5-10) |
| `aspect_ratio` | string | Output aspect ratio (model-dependent) |

## Duration Limits

| Model | Min | Max | Default |
|-------|-----|-----|---------|
| Wan 2.5 | 5s | 10s | 5s |
| Kling 2.5 | 5s | 10s | 5s |
| Veo 3.1 | 5s | 10s | 5s |
| MiniMax | 5s | 6s | 5s |
| Luma | 5s | 10s | 5s |

## Common Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_API_KEY` | Missing or invalid FAL_API_KEY | Check .env file |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `CONTENT_FILTERED` | Content policy violation | Modify prompt |
| `INVALID_IMAGE` | Image format not supported | Use PNG/JPG/WebP |
| `TIMEOUT` | Generation took too long | Retry or use faster model |

## Best Practices

### Prompting Tips

1. **Describe motion, not content**: The image provides the content; prompt describes movement
   - Good: "camera slowly pans right, gentle breeze"
   - Bad: "a beautiful garden with flowers"

2. **Be specific about camera movement**:
   - "dolly in slowly"
   - "tracking shot following subject"
   - "static camera, only subject moves"

3. **Describe physics and timing**:
   - "slow motion water splash"
   - "quick zoom with motion blur"
   - "gentle swaying motion"

### Workflow Tips

1. **Iterate cheap**: Use Wan ($0.05/sec) or Kling ($0.07/sec) to perfect your prompt
2. **Test before final**: Use Veo Fast ($0.15/sec) to verify quality
3. **Render once**: Only use Veo Standard ($0.40/sec) when confident

### Cost Management

| Budget | Strategy |
|--------|----------|
| Minimal | Wan only, single render |
| Moderate | Kling for iteration + 1 Veo final |
| Quality-focused | Kling iteration + Veo Fast test + Veo Standard final |

## Pricing Summary (January 2026)

### Fal.ai Pricing (per second)
- Wan 2.5: $0.05/sec
- Kling 2.5 Turbo Pro: $0.07/sec
- Veo 3.1 Fast: $0.15/sec (via Fal.ai)
- Veo 3.1 Standard: $0.40/sec
- Ovi: $0.20/video (flat rate)

### Cost per 5-second video
- Wan: $0.25
- Kling: $0.35
- Veo Fast: $0.75
- Veo Standard: $2.00

## API Documentation

For official Fal.ai documentation:
- Main docs: https://docs.fal.ai/
- Image-to-video guide: https://docs.fal.ai/examples/model-apis/generate-videos-from-image
- Model explorer: https://fal.ai/models?categories=video
- Pricing: https://fal.ai/pricing

## Changelog

### January 22, 2026
- Initial model library created
- Core models: Wan 2.5, Kling 2.5 Turbo Pro, Veo 3.1 Fast/Standard
- Additional models: MiniMax Hailuo, Luma Dream Machine, PixVerse
