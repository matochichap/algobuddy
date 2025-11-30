import { NextFunction, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { Difficulty, Topic } from 'shared';

export type ValidationTargets = {
    body?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
};

export const validate = (schemas: ValidationTargets) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                const parsed = schemas.body.parse(req.body);
                // attach parsed to request for downstream usage
                (req as any).validatedBody = parsed;
            }
            if (schemas.query) {
                const parsed = schemas.query.parse(req.query);
                (req as any).validatedQuery = parsed;
            }
            if (schemas.params) {
                const parsed = schemas.params.parse(req.params);
                (req as any).validatedParams = parsed;
            }
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: err.issues.map((issue: any) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    }))
                });
            }
            next(err as any);
        }
    };

// Question validation schemas
export const questionSchemas = {
    queryQuestions: {
        query: z.object({
            title: z.string().optional(),
            topic: z.enum(Topic, {
                message: `Topic must be one of: ${Object.values(Topic).join(', ')}`
            }).optional(),
            difficulty: z.enum(Difficulty, {
                message: `Difficulty must be one of: ${Object.values(Difficulty).join(', ')}`
            }).optional(),
            questionSeed: z.string().regex(/^\d+$/, "Question seed must be a valid number").optional()
        }).refine((data: any) => {
            // If questionSeed is provided, topic and difficulty are required
            if (data.questionSeed) {
                return data.topic && data.difficulty;
            }
            return true;
        }, {
            message: "When questionSeed is provided, both topic and difficulty are required"
        })
    },

    createQuestion: {
        body: z.object({
            title: z.string().min(1, "Title is required").max(500, "Title too long"),
            description: z.string().min(1, "Description is required"),
            difficulty: z.enum(Difficulty, {
                message: `Difficulty must be one of: ${Object.values(Difficulty).join(', ')}`
            }),
            topics: z.array(z.enum(Topic, {
                message: `Topic must be one of: ${Object.values(Topic).join(', ')}`
            })).min(1, "At least one topic is required")
        })
    },

    updateQuestion: {
        params: z.object({
            id: z.string().min(1, "Question ID is required")
        }),
        body: z.object({
            title: z.string().min(1, "Title is required").max(500, "Title too long").optional(),
            description: z.string().min(1, "Description is required").optional(),
            difficulty: z.enum(Difficulty, {
                message: `Difficulty must be one of: ${Object.values(Difficulty).join(', ')}`
            }).optional(),
            topics: z.array(z.enum(Topic, {
                message: `Topic must be one of: ${Object.values(Topic).join(', ')}`
            })).min(1, "At least one topic is required").optional()
        }).refine((data: any) => Object.keys(data).length > 0, {
            message: "At least one field must be provided for update"
        })
    },

    deleteQuestion: {
        params: z.object({
            id: z.string().min(1, "Question ID is required")
        })
    }
};