/**
 * Provision the scoped hotel check-in user for conference logistics.
 *
 * Usage:
 *   cd rhub
 *   HOTEL_USER_PASSWORD='your-password' npm run setup:hotel-user
 *
 * Or pass the password as the first CLI argument (avoid shell history when possible):
 *   npm run setup:hotel-user -- 'your-password'
 *
 * Requires DATABASE_URL. Run migrations first (`npx prisma migrate deploy`).
 * Idempotent: updates password and ConfMember link if the user already exists.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_CONF_SLUG,
  ensureDefaultConference,
} from "../src/lib/conf/bootstrap";

const prisma = new PrismaClient();

const HOTEL_EMAIL = "hotel@ekddigital.com";
const HOTEL_NAME = "Hotel";

function resolvePassword(): string {
  const fromArg = process.argv[2]?.trim();
  if (fromArg) return fromArg;

  const fromEnv = process.env.HOTEL_USER_PASSWORD?.trim();
  if (fromEnv) return fromEnv;

  console.error(
    "Missing password. Set HOTEL_USER_PASSWORD or pass it as the first argument.",
  );
  process.exit(1);
}

async function main() {
  const password = resolvePassword();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: HOTEL_EMAIL },
    create: {
      email: HOTEL_EMAIL,
      name: HOTEL_NAME,
      password: hashedPassword,
      role: "USER",
      isActive: true,
      emailVerified: true,
      accessStatus: "APPROVED",
      canAccessHub: true,
      canAccessConference: true,
      canAccessAdmin: false,
    },
    update: {
      name: HOTEL_NAME,
      password: hashedPassword,
      role: "USER",
      isActive: true,
      emailVerified: true,
      accessStatus: "APPROVED",
      canAccessHub: true,
      canAccessConference: true,
      canAccessAdmin: false,
    },
  });

  const conf =
    (await prisma.confEvent.findFirst({ where: { slug: DEFAULT_CONF_SLUG } })) ??
    (await ensureDefaultConference());

  const existingMember = await prisma.confMember.findFirst({
    where: {
      confId: conf.id,
      OR: [{ userId: user.id }, { email: HOTEL_EMAIL }],
    },
  });

  if (existingMember) {
    await prisma.confMember.update({
      where: { id: existingMember.id },
      data: {
        userId: user.id,
        name: HOTEL_NAME,
        email: HOTEL_EMAIL,
        role: "HOTEL_CHECKIN",
        title: "Hotel Check-in",
        committeeScope: "Hotel",
        isActive: true,
        canApprovePayments: false,
        canAssignCommittee: false,
      },
    });
  } else {
    await prisma.confMember.create({
      data: {
        confId: conf.id,
        userId: user.id,
        name: HOTEL_NAME,
        email: HOTEL_EMAIL,
        role: "HOTEL_CHECKIN",
        title: "Hotel Check-in",
        committeeScope: "Hotel",
        isActive: true,
        canApprovePayments: false,
        canAssignCommittee: false,
      },
    });
  }

  console.log("Hotel check-in user ready.");
  console.log(`  Email: ${HOTEL_EMAIL}`);
  console.log(`  Conference: ${conf.name} (${conf.slug})`);
  console.log("  Conf role: HOTEL_CHECKIN");
  console.log(
    "  Allowed routes: /tools/conf, /tools/conf/delegates, /tools/conf/logistics/name-list",
  );
}

main()
  .catch((error) => {
    console.error("Failed to provision hotel user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
