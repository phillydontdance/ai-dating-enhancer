import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      imageUrl?: string;
      background?: string;
    };

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ ok: false, error: 'Stripe is not configured.' }, { status: 500 });
    }

    const email = String(body.email || '').trim();
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const background = String(body.background || 'Warm Gray').trim() || 'Warm Gray';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    if (!imageUrl) {
      return NextResponse.json({ ok: false, error: 'An uploaded image URL is required.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Headshot Pack',
              description: 'One-time 10-image generation bundle',
            },
            unit_amount: CHECKOUT_PRICE_IN_CENTS,
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        imageUrl,
        background,
        email,
      },
    });

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create Stripe checkout.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
