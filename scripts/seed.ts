const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

async function main() {
  try {
    await database.genre.createMany({
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

    await database.category.createMany({
      data: [
        { name: "3D Assets" },
        { name: "Collectibles" },
        { name: "Gaming Assets" },
        { name: "Image" },
        { name: "Interactive" },
        { name: "Literary" },
        { name: "Logo" },
        { name: "Music" },
        { name: "Podcast" },
        { name: "Video" },
      ],
    });

    console.log("Success");
  } catch (error) {
    console.log("Error seeding the database genres and category", error);
  } finally {
    await database.$disconnect();
  }
}

main();
