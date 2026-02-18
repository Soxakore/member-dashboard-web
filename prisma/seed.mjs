import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const loginId = "ADMIN00001";
    const pin = "1234";
    const pinHash = await bcrypt.hash(pin, 10);

    const user = await prisma.user.upsert({
        where: { loginId },
        update: {},
        create: {
            loginId,
            pinHash,
            username: "System Admin",
            role: "R5",
            furnaceLevel: 30,
            power: 100000000n,
        },
    });

    console.log({ user: { ...user, power: user.power.toString() } });
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
