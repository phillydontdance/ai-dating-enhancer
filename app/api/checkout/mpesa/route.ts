import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body?.phone || '').replace(/\s+/g, '');
    const amount = Number(body?.amount || 2300);
    const email = String(body?.email || '');
    const userId = String(body?.userId || 'anonymous');

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
    }

    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      const payment = await prisma.payment.create({
        data: {
          userId: userId === 'anonymous' ? null : userId,
          userEmail: email || null,
          method: 'mpesa',
          amount: Math.round(amount),
          status: 'pending',
          externalRef: `demo_${Date.now()}`,
        },
      });

      return NextResponse.json({
        ok: true,
        checkoutRequestId: payment.externalRef,
        merchantRequestId: `demo_${Date.now()}`,
        responseCode: '0',
        responseDescription: 'M-Pesa is not configured; demo checkout created.',
      });
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unable to authenticate with Daraja.' }, { status: 500 });
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const shortCode = process.env.SAFARICOM_SHORTCODE || '174379';
    const passkey = process.env.SAFARICOM_PASSKEY || '';
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const requestBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: process.env.SAFARICOM_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/mpesa`,
      AccountReference: 'Headshotly',
      TransactionDesc: 'Headshotly AI Headshots',
    };

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const stkData = await stkResponse.json();

    await prisma.payment.create({
      data: {
        userId: userId === 'anonymous' ? null : userId,
        userEmail: email || null,
        method: 'mpesa',
        amount: Math.round(amount),
        status: 'pending',
        externalRef: String(stkData.CheckoutRequestID || `mpesa_${Date.now()}`),
      },
    });

    return NextResponse.json({
      ok: true,
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      responseCode: stkData.ResponseCode,
      responseDescription: stkData.ResponseDescription,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to initialize M-Pesa checkout.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
