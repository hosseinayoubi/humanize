import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  __prismaEnvLogged?: boolean;
};

function maskDb(url?: string) {
  if (!url) return "MISSING";
  try {
    const u = new URL(url);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    return "INVALID_URL";
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ✅ در PROD فقط وقتی مشکل داریم، یک بار لاگ کن (امن و ماسک‌شده)
if (!globalForPrisma.__prismaEnvLogged) {
  const db = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;

  // فقط اگر DATABASE_URL نیست/خرابه لاگ بده (برای Vercel runtime debug)
  if (!db) {
    console.error("[prisma] DATABASE_URL is missing in runtime!");
    console.error("[prisma] DATABASE_URL:", maskDb(db));
    console.error("[prisma] DIRECT_URL:", maskDb(direct));
  }

  globalForPrisma.__prismaEnvLogged = true;
}
