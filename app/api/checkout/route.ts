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
    const body = (await request.json()) as {
      email?: string;
      amount?: number;
      imageUrls?: unknown[];
      background?: string;
      cvText?: string;
      userId?: string;
    };

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ ok: false, error: 'Stripe is not configured.' }, { status: 500 });
    }

    const email = String(body.email || '').trim();
    const amount = Number(body.amount || 1500);
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      : [];
    const background = String(body.background || 'Warm Gray');
    const cvText = String(body.cvText || '');
    const userId = String(body.userId || 'anonymous');

    if (!imageUrls.length) {
      return NextResponse.json({ ok: false, error: 'At least one image URL is required.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Professional Headshots',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel`,
      metadata: {
        email,
        background,
        cvText,
        imageUrls: JSON.stringify(imageUrls),
        userId: userId === 'anonymous' ? 'anonymous' : userId,
      },
    });

    await prisma.payment.create({
      data: {
        userId: userId === 'anonymous' ? null : userId,
        userEmail: email || null,
        method: 'stripe',
        amount,
        status: 'pending',
        externalRef: session.id,
      },
    });

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create Stripe checkout.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
