import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { prisma } from '@/lib/prisma';

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
    const currentStatus = (replicateStatus as { status?: string; output?: unknown })?.status || job.status;

    await prisma.job.update({
      where: { id: jobId },
      data: { status: String(currentStatus) },
    });

    return NextResponse.json({
      status: currentStatus,
      complete: currentStatus === 'succeeded' || currentStatus === 'completed',
      outputUrls: job.outputUrls,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to resolve job status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
