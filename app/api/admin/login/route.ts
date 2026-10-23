import { NextResponse } from 'next/server';
import { setAdminSessionCookie, validateAdminCredentials } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const isValid = validateAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setAdminSessionCookie(response, email);
    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to sign in.' }, { status: 500 });
  }
}
