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
    const userId = String(body?.userId || 'anonymous');
    const amount = Number(body?.amount || 1500);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Headshotly Professional Headshots',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel`,
      metadata: {
        userId: userId === 'anonymous' ? 'anonymous' : userId,
        email,
        method: 'stripe',
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
    const message = error instanceof Error ? error.message : 'Unable to create Stripe session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
