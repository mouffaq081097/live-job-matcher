import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_EMAIL ?? "demo@livejobmatch.app";
  const password = process.env.SEED_PASSWORD ?? "Password123!";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Demo User", passwordHash },
    update: { passwordHash },
  });

  const existingCv = await prisma.cvDocument.findFirst({
    where: { userId: user.id },
  });
  if (!existingCv) {
    await prisma.cvDocument.create({
      data: {
        userId: user.id,
        name: "Master CV",
        payload: {
          blockIds: [],
          blocks: {},
          layout: "single",
          stylePreset: "executive",
          rolePreset: "technical",
          compactSpacing: false,
        },
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
