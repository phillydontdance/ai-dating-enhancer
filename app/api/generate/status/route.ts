import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN || '' });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    if (!job.replicateJobId) {
      return NextResponse.json({ status: job.status, complete: false });
    }

    const replicateStatus = await replicate.predictions.get(job.replicateJobId);
    const currentStatus = String((replicateStatus as { status?: string } | undefined)?.status || job.status);
    const outputUrls = Array.isArray((replicateStatus as { output?: unknown } | undefined)?.output)
      ? ((replicateStatus as { output?: unknown }).output as unknown[])
          .filter((value): value is string => typeof value === 'string' && Boolean(value))
      : Array.isArray(job.outputUrls)
        ? job.outputUrls.filter((value): value is string => typeof value === 'string' && Boolean(value))
        : [];

    if (currentStatus === 'succeeded' || currentStatus === 'completed') {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'completed', outputUrls },
      });
    } else if (currentStatus === 'failed' || currentStatus === 'canceled' || currentStatus === 'cancelled') {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: `Replicate job ended in ${currentStatus} state`,
        },
      });
    } else {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: currentStatus },
      });
    }

    return NextResponse.json({
      status: currentStatus,
      complete: currentStatus === 'succeeded' || currentStatus === 'completed',
      outputUrls,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to resolve job status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
