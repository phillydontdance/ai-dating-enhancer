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
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
    }

    const body = await request.json();
    const email = String(body?.email || '');
    const background = String(body?.background || 'Warm Gray').trim() || 'Warm Gray';
    const candidateImageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const candidateImageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls.filter((value: unknown): value is string => typeof value === 'string' && Boolean(value.trim()))
      : [];
    const jobId = typeof body?.jobId === 'string' ? body.jobId.trim() : '';

    let job = null;
    if (jobId) {
      job = await prisma.job.findUnique({ where: { id: jobId } });
    } else {
      const imageUrls = candidateImageUrls.length
        ? candidateImageUrls
        : candidateImageUrl
          ? [candidateImageUrl]
          : [];

      if (!imageUrls.length) {
        return NextResponse.json({ ok: false, error: 'An uploaded image URL is required.' }, { status: 400 });
      }

      job = await prisma.job.create({
        data: {
          status: 'pending',
          background,
          inputUrls: imageUrls,
        },
      });
    }

    if (!job) {
      return NextResponse.json({ ok: false, error: 'Checkout job was not found.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Headshotly Professional Headshots',
            },
            unit_amount: 1500,
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/`,
      metadata: {
        jobId: job.id,
        email,
        background,
      },
    });

    await prisma.payment.create({
      data: {
        method: 'stripe',
        amount: 1500,
        status: 'pending',
        externalRef: session.id,
        userEmail: email || null,
      },
    });

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create Stripe session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
