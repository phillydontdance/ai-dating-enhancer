import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resultCode = Number(body?.Body?.stkCallback?.ResultCode ?? 1);
    const resultDesc = String(body?.Body?.stkCallback?.ResultDesc || 'M-Pesa callback');
    const checkoutRequestId = String(body?.Body?.stkCallback?.CheckoutRequestID || '');

    // TODO: update payment record in DB using checkoutRequestId.
    console.log('M-Pesa callback:', { resultCode, resultDesc, checkoutRequestId });

    return NextResponse.json({ ok: true, resultCode, resultDesc });
  } catch {
    return NextResponse.json({ error: 'Invalid M-Pesa callback.' }, { status: 400 });
  }
}
