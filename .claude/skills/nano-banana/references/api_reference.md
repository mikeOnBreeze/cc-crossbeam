# Nano Banana API Reference

Quick reference for Google Gemini's Nano Banana image generation models.

## Models

| Model ID | Name | Best For | Max Reference Images |
|----------|------|----------|---------------------|
| `gemini-3-pro-image-preview` | Nano Banana Pro | High quality, text rendering, complex prompts | 14 |
| `gemini-2.5-flash-image` | Nano Banana | Fast iterations, high volume, lower cost | 14 |

### Model Selection Guide

- **Nano Banana Pro** (`gemini-3-pro-image-preview`):
  - Best text rendering in images
  - Advanced reasoning for complex instructions
  - Higher fidelity output
  - Use for: logos, infographics, professional assets

- **Nano Banana** (`gemini-2.5-flash-image`):
  - Faster generation
  - Lower cost per image
  - Good for quick iterations
  - Use for: prototyping, bulk generation, experimentation

## Aspect Ratios

| Ratio | Use Case |
|-------|----------|
| `1:1` | Square - profile pictures, icons, logos |
| `2:3` | Portrait - posters, book covers |
| `3:2` | Landscape - photos, banners |
| `3:4` | Portrait - social media stories |
| `4:3` | Landscape - presentations, displays |
| `4:5` | Portrait - Instagram posts |
| `5:4` | Landscape - prints |
| `9:16` | Vertical - mobile, TikTok, Reels |
| `16:9` | Widescreen - YouTube, desktop wallpapers |
| `21:9` | Ultra-wide - cinematic, banners |

## Supported Input Formats

For image editing, the following formats are supported:
- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- WebP (`.webp`)
- GIF (`.gif`)

## Common Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| `SAFETY_BLOCKED` | Prompt violated content policy | Modify prompt to be more appropriate |
| `INVALID_ARGUMENT` | Bad parameter value | Check aspect ratio, size, model values |
| `RESOURCE_EXHAUSTED` | Rate limit exceeded | Wait and retry, or use batch API |
| `PERMISSION_DENIED` | Invalid or missing API key | Check GEMINI_API_KEY in .env |
| `NOT_FOUND` | Model not available | Verify model ID is correct |

## Rate Limits

- Standard tier: ~60 requests per minute
- Higher tiers available through Google Cloud
- For high-volume needs, consider the Batch API (24-hour turnaround)

## Pricing (as of 2025)

- **Nano Banana** (`gemini-2.5-flash-image`): ~$0.039 per image
- **Nano Banana Pro** (`gemini-3-pro-image-preview`): Contact Google for pricing

## Best Practices

### Prompting Tips

1. **Be specific**: Include details about style, lighting, composition
2. **Describe what you want**: Not what you don't want
3. **Use reference images**: Up to 14 for consistency
4. **Specify text content**: Model handles text rendering well

### Performance Tips

1. **Use Flash for iterations**: Switch to Pro for final output
2. **Batch similar requests**: Group operations when possible
3. **Cache results**: Store generated images locally
4. **Handle errors gracefully**: Implement retry logic

## API Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

## Authentication

Set the `GEMINI_API_KEY` environment variable or include in `.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

Get an API key at: https://aistudio.google.com/apikey

## Additional Features

### SynthID Watermarking
All generated images automatically include invisible SynthID watermarks for AI content identification.

### Multi-Image Reference
Nano Banana Pro supports up to 14 reference images:
- Up to 6 object images for high-fidelity reproduction
- Up to 5 human images for character consistency

### Google Search Grounding
Enable real-time information for current events/data (requires additional configuration).
