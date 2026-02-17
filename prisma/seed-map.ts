import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Ensure admin exists
    let admin = await prisma.user.findUnique({ where: { loginId: "712147333" } });
    if (!admin) {
        console.log("Creating admin...");
        admin = await prisma.user.create({
            data: {
                loginId: "712147333",
                username: "Commander",
                role: "R5",
                pinHash: "mock_hash"
            }
        });
    }

    const locations = [
        { label: "Frost Fortress", type: "FORTRESS", x: 50, y: 50, description: "Main stronghold. high priority defense." },
        { label: "Wolf Pack", type: "ENEMY", x: 25, y: 30, description: "Level 4 wandering beasts." },
        { label: "Iron Mine", type: "RESOURCE", x: 70, y: 20, description: "Rich iron deposit." },
        { label: "Alpha Squad", type: "ALLY", x: 60, y: 60, description: "Forward operating base." },
        { label: "Frozen Lake", type: "RESOURCE", x: 15, y: 80, description: "Food gathering zone." },
    ];

    console.log("Seeding map locations...");
    for (const loc of locations) {
        await prisma.mapLocation.create({
            data: {
                ...loc,
                createdById: admin.id
            }
        });
    }
    console.log("Seeding complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
