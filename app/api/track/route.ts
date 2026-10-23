import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = String(body?.event || '');
    const userId = String(body?.userId || 'anonymous');
    const meta = body?.meta || {};

    if (!eventName) {
      return NextResponse.json({ error: 'Event name is required.' }, { status: 400 });
    }

    // TODO: persist to lightweight analytics table.
    console.log('Event tracked:', { eventName, userId, meta });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to record event.' }, { status: 500 });
  }
}
