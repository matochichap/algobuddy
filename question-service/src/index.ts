import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./server";
import { seedQuestions } from "./db/prisma";

const PORT = process.env.QUESTION_SERVICE_PORT!;

app.listen(PORT, async () => {
    await seedQuestions();
    console.log(`Question Service is running on port ${PORT}`);
});