import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
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
    const uploadedUrls = imageUrls;

    try {
      const output = await replicate.run(
        'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
        {
          input: {
            image: uploadedUrls[0],
            prompt: prompt,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            strength: 0.65,
            negative_prompt: 'blurry, low quality, distorted, cartoon, anime, painting',
          },
        },
      );

      console.log('Replicate output:', output);
      const finalOutput = Array.isArray(output) ? output[0] : output;

      const urls = normalizeReplicateOutput(finalOutput);
      if (!urls.length) {
        throw new Error('Replicate returned no usable output URL.');
      }

      jobStore.set(jobId, {
        status: 'completed',
        outputUrls: urls.slice(0, 10),
      });

      return NextResponse.json({
        ok: true,
        jobId,
        images: urls.slice(0, 10),
        count: urls.slice(0, 10).length,
      });
    } catch (replicateError) {
      console.error('Replicate API Error:', replicateError);
      const message = replicateError instanceof Error ? replicateError.message : 'Unknown Replicate error';
      jobStore.set(jobId, {
        status: 'failed',
        outputUrls: [],
        error: message,
      });
      throw new Error(`Replicate failed: ${message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export { jobStore };
