// prisma/seed.js
// Run with:  node prisma/seed.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

  // Hash the test password
  const hashedPassword = await bcrypt.hash("Test@1234", 10);

  // Upsert so re-running the seed doesn't throw a unique-constraint error
  const user = await prisma.user.upsert({
    where: { email: "test@ainotes.dev" },
    update: {},
    create: {
      name: "Test User",
      email: "test@ainotes.dev",
      password: hashedPassword,
    },
  });

  console.log(`✅  User created/found: ${user.email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
