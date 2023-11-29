const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

async function main() {
    try {
        await database.category.createMany({
            data: [
                { name: "Action" },
                { name: "Comedy" },
                { name: "Drama" },
                { name: "Sci-Fi" },
                { name: "Horror" },
                { name: "Romantic" },
                { name: "Fantasy" },
                { name: "Thriller" },
                { name: "Mystery" },
                { name: "Documentary" },
            ],
        });

        console.log("Success");
    } catch (error) {
        console.log("Error seeding the database categories", error);
    } finally {
        await database.$disconnect();
    }
}

main();
