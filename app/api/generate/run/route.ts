import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
  useFileOutput: false,
});

type RunRequestBody = {
  jobId?: string;
  style?: string;
  background?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunRequestBody;
    const jobId = String(body?.jobId || '');
    const style = String(body?.style || 'corporate');
    const background = String(body?.background || 'studio');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const prompt = `professional headshot, ${style} style, ${background} background, confident, high detail`;
    const prediction = await replicate.run('black-forest-labs/flux-dev', {
      input: {
        prompt,
        num_inference_steps: 20,
        guidance_scale: 7.5,
      },
    });

    const outputUrls = Array.isArray(prediction)
      ? prediction.filter((value): value is string => typeof value === 'string' && Boolean(value))
      : [String(prediction || '')].filter(Boolean);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        outputUrls,
      },
    });

    return NextResponse.json({ ok: true, outputUrls });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to run generation.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
