import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const loginId = "712147333";
    console.log(`Checking for user with loginId: ${loginId}`);

    const user = await prisma.user.findUnique({
        where: { loginId },
    });

    if (user) {
        console.log("User FOUND:", user);
    } else {
        console.log("User NOT FOUND. Creating...");
        await prisma.user.create({
            data: {
                loginId,
                username: "Commander",
                role: "R5",
                pinHash: "mock_hash_for_bypass"
            }
        });
        console.log("User CREATED.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
