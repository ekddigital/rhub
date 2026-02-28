import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Always reuse the same instance across hot reloads (dev) and between
// route-handler invocations in the same process (prod). Without this,
// every Turbopack HMR cycle spins up a new connection pool and exhausts
// the MySQL server's max_connections limit.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
