import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Clearing all map locations for grid migration...");
    await prisma.mapLocation.deleteMany({});
    console.log("Map cleared.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
