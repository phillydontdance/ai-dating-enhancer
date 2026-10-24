import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

const DEFAULT_PROMPT =
  'professional headshot, studio lighting, blurred office background, photorealistic, high quality, sharp focus';

function normalizeReplicateOutput(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && Boolean(item));
  }

  if (typeof value === 'string' && value.trim()) {
    return [value];
  }

  if (value && typeof value === 'object') {
    const candidate = (value as { output?: unknown; url?: unknown; image?: unknown }).output;
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is string => typeof item === 'string' && Boolean(item));
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      return [candidate];
    }
    const maybeImage = (value as { output?: unknown; url?: unknown; image?: unknown }).image;
    if (typeof maybeImage === 'string' && maybeImage.trim()) {
      return [maybeImage];
    }
  }

  return [];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      images?: unknown[];
      imageUrls?: unknown[];
      prompt?: string;
    };
    const imageUrls = Array.isArray(body?.images)
      ? body.images.filter((value: unknown): value is string => typeof value === 'string' && Boolean(value.trim()))
      : Array.isArray(body?.imageUrls)
        ? body.imageUrls.filter((value: unknown): value is string => typeof value === 'string' && Boolean(value.trim()))
        : [];

    if (!imageUrls.length) {
      return NextResponse.json(
        { error: 'At least one image URL is required in the request body. Upload to Cloudinary/S3 first.' },
        { status: 400 },
      );
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured.' },
        { status: 500 },
      );
    }

    const prompt = String(body?.prompt || DEFAULT_PROMPT);
    const variationConfigs = [
      { seed: 111, strength: 0.35, guidance_scale: 7.5, num_inference_steps: 25 },
      { seed: 222, strength: 0.42, guidance_scale: 8.0, num_inference_steps: 28 },
      { seed: 333, strength: 0.38, guidance_scale: 7.8, num_inference_steps: 26 },
      { seed: 444, strength: 0.45, guidance_scale: 8.2, num_inference_steps: 30 },
    ];

    const jobs = imageUrls.slice(0, 4).flatMap(
      (imageUrl: string, imageIndex: number) =>
        variationConfigs.map((variation, variationIndex: number) => ({
          imageUrl,
          imageIndex,
          variationIndex,
          input: {
            prompt,
            init_image: imageUrl,
            width: 1024,
            height: 1024,
            num_inference_steps: variation.num_inference_steps,
            guidance_scale: variation.guidance_scale,
            strength: variation.strength,
            seed: variation.seed + imageIndex + variationIndex,
          },
        })),
    );

    const results = await Promise.allSettled(
      jobs.map(
        ({ input }: { input: Record<string, string | number | boolean | undefined> }) =>
          replicate.run('stability-ai/sdxl', {
            input,
          }),
      ),
    );

    const generatedImages: string[] = [];
    const errors: Array<{ index: number; message: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const urls = normalizeReplicateOutput(result.value);
        if (urls.length) {
          generatedImages.push(...urls);
        } else {
          errors.push({
            index,
            message: 'Replicate returned no image URLs for this variation.',
          });
        }
      } else {
        errors.push({
          index,
          message: result.reason instanceof Error ? result.reason.message : 'Generation failed',
        });
      }
    });

    if (!generatedImages.length) {
      return NextResponse.json(
        {
          ok: false,
          error: 'All image generations failed.',
          details: errors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      images: generatedImages,
      errors,
      count: generatedImages.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image enhancement failed.';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
