import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resultCode = Number(body?.Body?.stkCallback?.ResultCode ?? 1);
    const resultDesc = String(body?.Body?.stkCallback?.ResultDesc || 'M-Pesa callback');
    const checkoutRequestId = String(body?.Body?.stkCallback?.CheckoutRequestID || '');

    if (checkoutRequestId) {
      await prisma.payment.updateMany({
        where: { externalRef: checkoutRequestId },
        data: {
          status: resultCode === 0 ? 'paid' : 'failed',
        },
      });
    }

    await prisma.event.create({
      data: {
        eventType: resultCode === 0 ? 'payment_completed' : 'payment_failed',
        metadata: {
          provider: 'mpesa',
          resultCode,
          resultDesc,
          checkoutRequestId,
        },
      },
    });

    return NextResponse.json({ ok: true, resultCode, resultDesc });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid M-Pesa callback.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
