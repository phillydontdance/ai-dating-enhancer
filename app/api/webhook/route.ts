import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { waitUntil } from '@vercel/functions';
import { setGenerationStatus } from '@/lib/generation-status';
import { prisma } from '@/lib/prisma';

const CHECKOUT_PRICE_IN_CENTS = 1500;

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
  const sessionId = session.id;
  const jobId = String(session.metadata?.jobId || '').trim();
  const background = String(session.metadata?.background || 'Warm Gray').trim() || 'Warm Gray';
  const email = String(session.metadata?.email || session.customer_email || '').trim();

  setGenerationStatus(sessionId, {
    status: 'processing',
    images: [],
    updatedAt: Date.now(),
  });

  if (!jobId || !email) {
    setGenerationStatus(sessionId, {
      status: 'failed',
      images: [],
      error: 'Missing job ID or email metadata in checkout session.',
      updatedAt: Date.now(),
    });
    return;
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    const imageUrls = Array.isArray(job?.inputUrls)
      ? job.inputUrls.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      : [];

    if (!imageUrls.length) {
      throw new Error('No uploaded image URL was found for this checkout session.');
    }

    const replicateResponse = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: imageUrls,
        background,
        cvText: '',
        jobId: sessionId,
        userEmail: email,
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

    if (!session.amount_total || session.amount_total < CHECKOUT_PRICE_IN_CENTS) {
      throw new Error('Checkout amount did not match the $15 expected amount.');
    }
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
