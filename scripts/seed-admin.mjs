import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";

const requiredVariables = [
  "DATABASE_URL",
  "ADMIN_PSEUDO",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

for (const variableName of requiredVariables) {
  if (!process.env[variableName]) {
    throw new Error(`${variableName} must be defined to seed the admin user.`);
  }
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

await prisma.user.upsert({
  where: {
    email: process.env.ADMIN_EMAIL,
  },
  update: {
    pseudo: process.env.ADMIN_PSEUDO,
    passwordHash,
  },
  create: {
    email: process.env.ADMIN_EMAIL,
    pseudo: process.env.ADMIN_PSEUDO,
    passwordHash,
    role: UserRole.ADMIN,
  },
});

await prisma.$disconnect();

console.log(`Admin user ready: ${process.env.ADMIN_EMAIL}`);
