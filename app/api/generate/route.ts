import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

const jobStore = new Map<
  string,
  { status: 'processing' | 'completed' | 'failed'; outputUrls: string[]; error?: string }
>();

function buildPrompt(background: string, cvText?: string) {
  const normalizedBackground = background || 'Warm Gray';
  const cvFragment = cvText && cvText.trim() ? `, ${cvText.trim().slice(0, 180)}` : '';
  return `professional headshot, studio lighting, ${normalizedBackground} background, business attire, photorealistic, high quality, sharp focus${cvFragment}`;
}

function normalizeReplicateOutput(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  }

  if (typeof value === 'string' && value.trim()) {
    return [value];
  }

  if (value && typeof value === 'object') {
    const maybeOutput = (value as { output?: unknown; url?: unknown; image?: unknown }).output;
    if (Array.isArray(maybeOutput)) {
      return maybeOutput.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
    }
    if (typeof maybeOutput === 'string' && maybeOutput.trim()) {
      return [maybeOutput];
    }

    const maybeImage = (value as { image?: unknown }).image;
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
      background?: string;
      cvText?: string;
      jobId?: string;
      userEmail?: string;
    };

    const imageUrls = Array.isArray(body.images)
      ? body.images.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
      : Array.isArray(body.imageUrls)
        ? body.imageUrls.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
        : [];

    if (!imageUrls.length) {
      return NextResponse.json({ error: 'At least one image URL is required.' }, { status: 400 });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN is not configured.' }, { status: 500 });
    }

    const jobId = String(body.jobId || `job_${Date.now()}`);
    const background = String(body.background || 'Warm Gray');
    const cvText = String(body.cvText || '');
    if (!jobStore.has(jobId)) {
      jobStore.set(jobId, { status: 'processing', outputUrls: [] });
    }

    const prompt = buildPrompt(background, cvText);
    const variationJobs = Array.from({ length: 10 }, (_, index) => {
      const selectedImage = imageUrls[index % imageUrls.length];
      return replicate.run('stability-ai/sdxl', {
        input: {
          prompt: `${prompt}, variation ${index + 1}`,
          init_image: selectedImage,
          width: 1024,
          height: 1024,
          num_inference_steps: 30,
          guidance_scale: 8,
          strength: 0.4,
          seed: 1000 + index * 29,
        },
      });
    });

    const settled = await Promise.allSettled(variationJobs);
    const generatedImages: string[] = [];
    const errors: string[] = [];

    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const urls = normalizeReplicateOutput(result.value);
        if (urls.length) {
          generatedImages.push(...urls);
        } else {
          errors.push(`Variation ${index + 1}: no output returned.`);
        }
      } else {
        errors.push(
          result.reason instanceof Error ? `Variation ${index + 1}: ${result.reason.message}` : `Variation ${index + 1}: generation failed.`,
        );
      }
    });

    if (!generatedImages.length) {
      jobStore.set(jobId, {
        status: 'failed',
        outputUrls: [],
        error: errors.join('; ') || 'All image generations failed.',
      });

      return NextResponse.json(
        { ok: false, error: 'All image generations failed.', details: errors },
        { status: 500 },
      );
    }

    const limitedImages = generatedImages.slice(0, 10);
    jobStore.set(jobId, {
      status: 'completed',
      outputUrls: limitedImages,
    });

    return NextResponse.json({
      ok: true,
      jobId,
      images: limitedImages,
      count: limitedImages.length,
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export { jobStore };
