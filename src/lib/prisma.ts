import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaSignature: string | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL in environment variables.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prismaSchemaSignature = Prisma.dmmf.datamodel.models
  .map((model) => `${model.name}:${model.fields.map((field) => field.name).join(",")}`)
  .join("|");

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaSignature !== prismaSchemaSignature
) {
  void globalForPrisma.prisma.$disconnect().catch(() => {
    // Ignore disconnect failures during hot reloads.
  });
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaSignature = prismaSchemaSignature;
}
