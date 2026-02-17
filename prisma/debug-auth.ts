import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const loginId = "712147333";
    const pin = "1234";

    const user = await prisma.user.findUnique({
        where: { loginId },
    });

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log(`User found: ${user.username}`);
    console.log(`Stored Hash: ${user.pinHash}`);

    const match = await bcrypt.compare(pin, user.pinHash);
    console.log(`Password '1234' match: ${match}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
