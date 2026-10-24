import { NextResponse } from 'next/server';
import { getGenerationStatus } from '@/lib/generation-status';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ status: 'processing', images: [] }, { status: 400 });
    }

    const result = getGenerationStatus(sessionId);
    if (!result) {
      return NextResponse.json({ status: 'processing', images: [] });
    }

    return NextResponse.json({
      status: result.status,
      images: result.images,
      error: result.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to read status.';
    return NextResponse.json({ status: 'failed', images: [], error: message }, { status: 500 });
  }
}
