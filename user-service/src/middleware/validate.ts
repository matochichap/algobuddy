import { NextFunction, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { UserRole } from 'shared';

export type ValidationTargets = {
    body?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
    headers?: z.ZodTypeAny;
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
            if (schemas.headers) {
                const parsed = schemas.headers.parse(req.headers);
                (req as any).validatedHeaders = parsed;
            }
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: err.issues.map((issue: any) => ({
                        path: issue.path.join('.'),
                        message: issue.message
                    }))
                });
            }
            next(err as any);
        }
    };

export const userSchemas = {
    getMeSchema: {
        headers: z.object({
            'x-user-id': z.string().min(1, 'User ID is required')
        })
    },

    updateMeSchema: {
        headers: z.object({
            'x-user-id': z.string().min(1, 'User ID is required')
        }),
        body: z.object({
            displayName: z.string().min(1, 'Display name cannot be empty').max(50).optional(),
            picture: z.url('Picture must be a valid URL').optional(),
        }).refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
            message: 'At least one field must be provided',
        })
    },

    deleteMeSchema: {
        headers: z.object({
            'x-user-id': z.string().min(1, 'User ID is required')
        })
    },

    searchUsersSchema: {
        query: z.object({
            q: z.string().trim().min(1, "Query parameter 'q' is required"),
        })
    },

    updateUserSchema: {
        params: z.object({
            id: z.string().min(1),
        }),
        body: z.object({
            displayName: z.string().min(1).max(50).optional(),
            firstName: z.string().min(0).max(50).optional(),
            lastName: z.string().min(0).max(50).optional(),
            picture: z.url().optional(),
            email: z.email().optional(),
            role: z.enum([UserRole.USER, UserRole.ADMIN]).optional(),
        }).refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
            message: 'At least one field must be provided',
        })
    },

    deleteUserSchema: {
        params: z.object({
            id: z.string().min(1),
        })
    },

}
