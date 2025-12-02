import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./server";
import fs from "fs";
import { prisma } from "./db/prisma";

const seedQuestions = async () => {
    const count = await prisma.question.count();
    if (count === 0) {
        console.log("Seeding initial questions");
        const raw = fs.readFileSync("./prisma/seed-data.json", "utf-8");
        const questions = JSON.parse(raw);
        await prisma.question.createMany({ data: questions });
        console.log(`Seeded ${questions.length} questions`);
    } else {
        console.log("Questions already exist, skipping seed.");
    }
}

const PORT = process.env.QUESTION_SERVICE_PORT!;

app.listen(PORT, async () => {
    await seedQuestions();
    console.log(`Question Service is running on port ${PORT}`);
});