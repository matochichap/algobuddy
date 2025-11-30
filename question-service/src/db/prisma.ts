import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();
const seedQuestions = async () => {
    const count = await prisma.question.count();
    if (count === 0) {
        console.log("Seeding initial questions");
        const raw = fs.readFileSync("./src/db/seed-data.json", "utf-8");
        const questions = JSON.parse(raw);
        await prisma.question.createMany({ data: questions });
        console.log(`Seeded ${questions.length} questions`);
    } else {
        console.log("Questions already exist, skipping seed.");
    }
}
export { prisma, seedQuestions };