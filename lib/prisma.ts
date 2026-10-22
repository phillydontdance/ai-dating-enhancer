import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables.',
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: ['error', 'warn'],
  });
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = globalForPrisma.prisma ?? buildClient();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
    return Reflect.get(client as object, prop, receiver);
  },
});