import { Router } from "express";
import { prisma } from "../db/prisma";
import { normalise } from "../utils/common";
import { validate, questionSchemas } from "../middleware/validate";

const router = Router();

router.get("/", validate(questionSchemas.queryQuestions), async (req, res) => {
    try {
        const { title, topic, difficulty, questionSeed } = (req as any).validatedQuery;
        const normalizedTopic = topic ? normalise(topic) : undefined;
        const normalizedDifficulty = difficulty ? normalise(difficulty) : undefined;

        // If questionSeed is provided, use seed-based selection
        if (questionSeed) {
            const seed = parseInt(questionSeed);

            const filters: any = {};
            filters.difficulty = normalizedDifficulty;
            filters.topics = { has: normalizedTopic };

            // Get count of matching questions
            const count = await prisma.question.count({ where: filters });

            if (count === 0) {
                return res.status(404).json({
                    error: "No questions found for the given filters"
                });
            }

            // Use seed to calculate offset and fetch single question
            const offset = seed % count;
            const selectedQuestion = await prisma.question.findFirst({
                where: filters,
                skip: offset,
                orderBy: [
                    { difficulty: 'asc' },
                    { topics: 'asc' }
                ]
            });

            return res.status(200).json(selectedQuestion);
        }

        // If no questionSeed, filter by available parameters or return all questions
        const filters: any = {};

        if (title) {
            filters.title = { contains: title, mode: 'insensitive' };
        }

        if (normalizedDifficulty) {
            filters.difficulty = normalizedDifficulty;
        }

        if (normalizedTopic) {
            filters.topics = { has: normalizedTopic };
        }

        // Fetch all matching questions
        const questions = await prisma.question.findMany({
            where: filters,
        });

        return res.status(200).json(questions);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch questions" });
    }
});

router.post("/", validate(questionSchemas.createQuestion), async (req, res) => {
    try {
        const { title, description, difficulty, topics } = req.body;

        const question = await prisma.question.create({
            data: {
                title,
                description,
                difficulty,
                topics
            },
        });

        res.status(201).json(question);
    } catch (err) {
        res.status(500).json({ error: "Failed to create question" });
    }
});

router.put("/:id", validate(questionSchemas.updateQuestion), async (req, res) => {
    try {
        const { id } = (req as any).validatedParams;
        const { title, description, difficulty, topics } = (req as any).validatedBody;

        const updated = await prisma.question.update({
            where: { id },
            data: { title, description, difficulty, topics },
        });

        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update question" });
    }
});

router.delete("/:id", validate(questionSchemas.deleteQuestion), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.question.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: "Failed to delete question" });
    }
});

export default router;
