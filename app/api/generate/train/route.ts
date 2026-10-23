import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type UploadFile = {
  url?: string;
  publicUrl?: string;
};

type TrainRequestBody = {
  files?: UploadFile[];
  style?: string;
  background?: string;
};

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN || '' });

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrainRequestBody;
    const files = Array.isArray(body?.files) ? body.files : [];
    const style = String(body?.style || 'corporate');
    const background = String(body?.background || 'studio');

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided.' }, { status: 400 });
    }

    const uploadedUrls = files
      .map((file) => file.url || file.publicUrl || '')
      .filter((url): url is string => Boolean(url));

    const job = await prisma.job.create({
      data: {
        userId: null,
        status: 'queued',
        style,
        background,
        prompt: `professional headshot ${style} ${background}`,
        inputUrls: uploadedUrls,
      },
    });

    const replicateResponse = await replicate.run('black-forest-labs/flux-dev-lora-trainer', {
      input: {
        images: files.map((file) => file.url || file.publicUrl),
        prompt: `professional headshot, ${style}, ${background}, high detail`,
        num_steps: 20,
      },
    });

    const replicateJobId = String((replicateResponse as { id?: string } | undefined)?.id || replicateResponse || job.id);

    await prisma.job.update({
      where: { id: job.id },
      data: {
        replicateJobId,
        status: 'training',
      },
    });

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      replicateJobId,
      urls: uploadedUrls,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start training.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
