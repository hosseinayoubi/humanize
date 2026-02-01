import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// اتصال به دیتابیس برای جلوگیری از مشکلات cold start
prisma.$connect().catch((e) => {
  console.error("Failed to connect to database:", e)
})
