import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-09-30.endive',
  });
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  const sig = request.headers.get('stripe-signature') || '';
  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userEmail = session.customer_email || session.metadata?.email || 'unknown';
    const jobId = String(session.metadata?.jobId || '');
    const sessionId = session.id;

    let job = null;
    if (jobId) {
      job = await prisma.job.findUnique({
        where: { id: jobId },
      });
    }

    const inputUrls = Array.isArray(job?.inputUrls)
      ? job.inputUrls.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      : [];

    await prisma.payment.updateMany({
      where: { externalRef: sessionId },
      data: {
        userEmail,
        status: 'paid',
      },
    });

    await prisma.event.create({
      data: {
        eventType: 'payment_completed',
        metadata: {
          provider: 'stripe',
          sessionId,
          amount: session.amount_total,
          email: userEmail,
          jobId,
          imageCount: inputUrls.length,
        },
      },
    });
  }

  return NextResponse.json({ received: true });
}
