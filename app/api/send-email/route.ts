import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      images?: string[];
      cvText?: string;
      subject?: string;
    };

    const email = String(body.email || '').trim();
    const images = Array.isArray(body.images) ? body.images.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
    const cvText = String(body.cvText || '');

    if (!email) {
      return NextResponse.json({ error: 'Recipient email is required.' }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured.' }, { status: 500 });
    }

    const imageGrid = images.length
      ? images
          .map(
            (image, index) => `
              <div style="display:inline-block;width:48%;margin:8px 1%;vertical-align:top;">
                <img src="${image}" alt="Generated headshot ${index + 1}" style="width:100%;border-radius:12px;border:1px solid #e5e7eb;display:block;" />
              </div>
            `,
          )
          .join('')
      : '<p>No generated images were provided.</p>';

    const resumeBlock = cvText
      ? `<section style="margin-top:20px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
           <h3 style="margin:0 0 10px;font-size:16px;color:#111827;">CV / Resume notes</h3>
           <p style="margin:0;color:#374151;line-height:1.6;white-space:pre-wrap;">${cvText.replace(/\n/g, '<br />')}</p>
         </section>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;background:#f9fafb;padding:32px;">
        <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;padding:28px;">
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#111827;">Your 10 Professional Headshots Are Ready</h1>
          <p style="margin:0 0 20px;color:#4b5563;">Your enhanced profile photos are ready to review and download.</p>
          <div style="display:block;">${imageGrid}</div>
          ${resumeBlock}
          <div style="margin-top:24px;">
            <a href="${images[0] || '#'}" style="display:inline-block;background:#ec4899;color:#ffffff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:600;">Open first image</a>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: email,
      subject: body.subject || 'Your 10 Professional Headshots Are Ready',
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email delivery failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
