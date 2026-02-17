import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.mapLocation.count();
    console.log(`Total Map Locations: ${count}`);

    if (count > 0) {
        const locations = await prisma.mapLocation.findMany({ take: 5 });
        console.log("Sample locations:", locations);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
