import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

function maskDb(url?: string) {
  if (!url) return "MISSING"
  try {
    const u = new URL(url)
    if (u.password) u.password = "****"
    return u.toString()
  } catch {
    return "INVALID_URL"
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// ✅ یک بار در runtime لاگ کن (بدون پسورد) تا بفهمیم واقعاً چی ست شده
if (process.env.NODE_ENV !== "production") {
  console.log("DATABASE_URL:", maskDb(process.env.DATABASE_URL))
  console.log("DIRECT_URL:", maskDb(process.env.DIRECT_URL))
}
