import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  useFileOutput: false,
});

const jobStore = new Map<
  string,
  { status: 'processing' | 'completed' | 'failed'; outputUrls: string[]; error?: string }
>();

function buildPrompt(background: string, cvText?: string, profession?: string) {
  const normalizedBackground = background || 'Warm Gray';
  const cvFragment = cvText && cvText.trim() ? `, ${cvText.trim().slice(0, 180)}` : '';
  const professionFragment = profession && profession.trim() ? `, ${profession.trim()}` : '';
  return `professional headshot, studio lighting, ${normalizedBackground} background, business attire, photorealistic, high quality, sharp focus${cvFragment}${professionFragment}`;
}

function extractImageUrlFromReplicateOutput(output: unknown): string {
  console.log('Raw Replicate output:', JSON.stringify(output));

  const extractStringFromCandidate = (candidate: unknown): string | null => {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }

    if (Array.isArray(candidate) && candidate.length > 0) {
      for (const item of candidate) {
        const found = extractStringFromCandidate(item);
        if (found) return found;
      }
    }

    if (candidate && typeof candidate === 'object') {
      const maybe = candidate as {
        url?: unknown;
        output?: unknown;
        image?: unknown;
        images?: unknown[];
      };

      const direct = extractStringFromCandidate(maybe.url ?? maybe.output ?? maybe.image);
      if (direct) return direct;

      if (Array.isArray(maybe.images)) {
        for (const item of maybe.images) {
          const found = extractStringFromCandidate(item);
          if (found) return found;
        }
      }
    }

    return null;
  };

  const imageUrl = extractStringFromCandidate(output);

  if (!imageUrl) {
    const errorMessage = `Replicate returned no usable output URL. Raw output: ${JSON.stringify(output)}`;
    console.error('Could not extract URL from output:', output);
    throw new Error(errorMessage);
  }

  return imageUrl;
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
    const contentType = request.headers.get('content-type') || '';
    let background = 'Warm Gray';
    let profession = '';
    let imageUrls: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      background = String(formData.get('background') || 'Warm Gray');
      profession = String(formData.get('profession') || '').trim();

      const files = formData.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);
      if (!files.length) {
        return NextResponse.json({ ok: false, error: 'No image files were uploaded.' }, { status: 400 });
      }

      imageUrls = (
        await Promise.all(
          files.map((file) =>
            put(`headshots/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, file, {
              access: 'public',
              addRandomSuffix: true,
              contentType: file.type || 'image/jpeg',
            }).then((entry) => entry.url),
          ),
        )
      ).filter((url): url is string => Boolean(url));
    } else {
      const body = (await request.json()) as {
        images?: unknown[];
        imageUrls?: unknown[];
        background?: string;
        cvText?: string;
        jobId?: string;
        userEmail?: string;
        profession?: string;
      };

      background = String(body.background || 'Warm Gray');
      profession = String(body.profession || '').trim();
      imageUrls = Array.isArray(body.images)
        ? body.images.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
        : Array.isArray(body.imageUrls)
          ? body.imageUrls.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
          : [];
    }

    if (!imageUrls.length) {
      return NextResponse.json({ ok: false, error: 'At least one image URL is required.' }, { status: 400 });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'REPLICATE_API_TOKEN is not configured.' }, { status: 500 });
    }

    const jobId = `job_${Date.now()}`;
    const prompt = buildPrompt(background, undefined, profession);

    if (!jobStore.has(jobId)) {
      jobStore.set(jobId, { status: 'processing', outputUrls: [] });
    }

    try {
      const output = await replicate.run(
        'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
        {
          input: {
            image: imageUrls[0],
            prompt: prompt,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            strength: 0.65,
            negative_prompt: 'blurry, low quality, distorted, cartoon, anime, painting, deformed',
          },
        },
      );

      const extractedImageUrl = extractImageUrlFromReplicateOutput(output);
      const normalized = normalizeReplicateOutput(extractedImageUrl);

      jobStore.set(jobId, {
        status: 'completed',
        outputUrls: normalized.slice(0, 10),
      });

      return NextResponse.json({
        ok: true,
        success: true,
        jobId,
        images: normalized.slice(0, 10),
        count: normalized.slice(0, 10).length,
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
    return NextResponse.json({ ok: false, success: false, error: message }, { status: 500 });
  }
}

export { jobStore };
