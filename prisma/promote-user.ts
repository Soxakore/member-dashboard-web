import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const targetId = "712147333";

    const user = await prisma.user.findUnique({
        where: { loginId: targetId },
    });

    if (user) {
        console.log(`User found: ${user.username} (${user.role})`);
        await prisma.user.update({
            where: { loginId: targetId },
            data: { role: "R5" }
        });
        console.log(`Successfully promoted ${targetId} to R5 (Admin).`);
    } else {
        console.log(`User ${targetId} not found. Creating new Admin account...`);
        const pinHash = await bcrypt.hash("1234", 10);
        await prisma.user.create({
            data: {
                loginId: targetId,
                pinHash,
                username: "Commander",
                role: "R5",
                furnaceLevel: 30,
                power: 100000000,
            }
        });
        console.log(`Created Admin account for ${targetId} with PIN '1234'.`);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
