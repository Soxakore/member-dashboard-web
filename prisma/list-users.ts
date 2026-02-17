import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            loginId: true,
            username: true,
            role: true,
            createdAt: true
        }
    });

    console.log("Recent Users:");
    users.forEach(u => {
        console.log(`- [${u.role}] ${u.username || "Unknown"} (ID: ${u.loginId})`);
    });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
