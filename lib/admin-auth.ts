import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'headshotly_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export function getAdminSecret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'dev-admin-secret-change-me';
}

export function signValue(value: string) {
  const secret = getAdminSecret();
  const hash = createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${hash}`;
}

export function verifySignedValue(signedValue: string) {
  if (!signedValue || !signedValue.includes('.')) return false;

  const [payload, signature] = signedValue.split('.');
  if (!payload || !signature) return false;

  const expected = createHmac('sha256', getAdminSecret())
    .update(payload)
    .digest('base64url');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export function createAdminSessionValue(email: string) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return signValue(`${email}:${expiresAt}`);
}

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  if (!verifySignedValue(cookie)) return null;

  const [payload, _signature] = cookie.split('.');
  void _signature;
  if (!payload) return null;

  const [email, expiresAt] = payload.split(':');
  if (!email || !expiresAt) return null;

  const ts = Number(expiresAt);
  if (!Number.isFinite(ts) || ts < Date.now()) return null;

  return { email, expiresAt: ts };
}

export function validateAdminCredentials(email: string, password: string) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@headshotly.dev').trim().toLowerCase();
  const storedPassword = process.env.ADMIN_PASSWORD || '';

  if (!storedPassword) return false;
  if (email.trim().toLowerCase() !== adminEmail) return false;
  if (!password || password.length === 0) return false;

  const passwordBuffer = Buffer.from(password);
  const storedBuffer = Buffer.from(storedPassword);

  if (passwordBuffer.length !== storedBuffer.length) return false;

  return timingSafeEqual(passwordBuffer, storedBuffer);
}

export function setAdminSessionCookie(response: Response, email: string) {
  const value = createAdminSessionValue(email);
  response.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; Secure`,
  );
  return response;
}

export function clearAdminSessionCookie(response: Response) {
  response.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`,
  );
  return response;
}
