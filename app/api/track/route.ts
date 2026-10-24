import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = String(body?.event || '');
    const userId = String(body?.userId || 'anonymous');
    const meta = body?.meta || {};

    if (!eventName) {
      return NextResponse.json({ error: 'Event name is required.' }, { status: 400 });
    }

    await prisma.event.create({
      data: {
        eventType: eventName,
        userId: userId === 'anonymous' ? null : userId,
        metadata: meta,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to record event.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
