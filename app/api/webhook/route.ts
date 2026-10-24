import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { waitUntil } from '@vercel/functions';
import { setGenerationStatus } from '@/lib/generation-status';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-09-30.endive',
  });
}

async function processSuccessfulCheckout(session: Stripe.Checkout.Session, baseUrl: string) {
  const customerEmail = String(session.customer_email || session.metadata?.email || '');
  const sessionId = session.id;
  const rawImageUrls = session.metadata?.imageUrls || '[]';

  let imageUrls: string[] = [];
  try {
    const parsed = JSON.parse(rawImageUrls) as unknown[];
    imageUrls = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      : [];
  } catch {
    imageUrls = [];
  }

  const background = String(session.metadata?.background || 'Warm Gray');
  const cvText = String(session.metadata?.cvText || '');

  setGenerationStatus(sessionId, {
    status: 'processing',
    images: [],
    updatedAt: Date.now(),
  });

  if (!customerEmail || !imageUrls.length) {
    setGenerationStatus(sessionId, {
      status: 'failed',
      images: [],
      error: 'Missing email or image URLs.',
      updatedAt: Date.now(),
    });
    return;
  }

  try {
    const replicateResponse = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: imageUrls,
        background,
        cvText,
        jobId: sessionId,
      }),
    });

    const generationData = (await replicateResponse.json()) as {
      ok?: boolean;
      images?: string[];
      error?: string;
    };

    if (!replicateResponse.ok || !generationData.ok || !Array.isArray(generationData.images) || !generationData.images.length) {
      throw new Error(generationData.error || 'Generation failed.');
    }

    setGenerationStatus(sessionId, {
      status: 'complete',
      images: generationData.images,
      updatedAt: Date.now(),
    });

    await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        images: generationData.images,
        cvText,
        subject: 'Your 10 Professional Headshots Are Ready',
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed.';
    setGenerationStatus(sessionId, {
      status: 'failed',
      images: [],
      error: message,
      updatedAt: Date.now(),
    });
  }
}

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
    }

    const sig = request.headers.get('stripe-signature') || '';
    const rawBody = await request.text();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      waitUntil(processSuccessfulCheckout(session, baseUrl));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
