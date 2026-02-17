import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    const loginId = "ADMIN00001";
    const pin = "1234";
    const pinHash = await bcrypt.hash(pin, 10);

    const user = await prisma.user.upsert({
        where: { loginId },
        update: {},
        create: {
            loginId,
            pinHash, // In real app, this should be hashed!
            username: "System Admin",
            role: "R5",
            furnaceLevel: 30,
            power: 100000000,
        },
    });

    console.log({ user });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
