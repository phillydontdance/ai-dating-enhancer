import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body?.phone || '').replace(/\s+/g, '');
    const amount = Number(body?.amount || 3000);

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
    }

    const auth = Buffer.from(
      `${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`,
    ).toString('base64');

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
