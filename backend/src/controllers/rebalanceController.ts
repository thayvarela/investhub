import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';

const targetSchema = z.object({
    segmentKey: z.string(),
    targetPercentage: z.number().min(0).max(100),
});

const targetsArraySchema = z.array(targetSchema);

export const saveTargets = async (req: Request, res: Response) => {
    try {
        const targets = targetsArraySchema.parse(req.body);
        const userId = req.user!.id;

        // Use transaction to replace targets
        await prisma.$transaction([
            prisma.targetAllocation.deleteMany({ where: { userId } }),
            prisma.targetAllocation.createMany({
                data: targets.map(t => ({ ...t, userId })),
            }),
        ]);

        return res.json({ message: 'Targets updated successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to save targets' });
    }
};

export const getTargets = async (req: Request, res: Response) => {
    try {
        const targets = await prisma.targetAllocation.findMany({
            where: { userId: req.user!.id },
        });
        return res.json(targets);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch targets' });
    }
};
