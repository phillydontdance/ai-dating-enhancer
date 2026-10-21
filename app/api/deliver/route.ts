import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const images = Array.isArray(body?.images) ? body.images : [];
    const email = String(body?.email || '');

    if (!images.length) {
      return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
    }

    const zipUrl = `https://example.com/downloads/${Date.now()}.zip`;

    if (email) {
      await resend.emails.send({
        from: 'Headshotly <hello@headshotly.app>',
        to: email,
        subject: 'Your Headshotly download is ready',
        html: `<p>Your final 10 headshots are ready. Download them here: <a href="${zipUrl}">${zipUrl}</a></p>`,
      });
    }

    return NextResponse.json({ ok: true, downloadUrl: zipUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to prepare delivery.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
