import { Request, Response } from 'express';
import * as pluggyService from '../services/pluggyService';

export const getConnectToken = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.body; // Optional update mode
        const token = await pluggyService.getConnectToken(itemId);
        res.json({ accessToken: token });
    } catch (error) {
        res.status(500).json({ error: "Failed to create connect token" });
    }
};

export const syncItem = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.body;
        // Assume Auth Middleware adds user to req (req.user)
        // But let's check how auth is handled. 
        // For now, I'll assume we can get userId from the request if authenticated, 
        // or simple mock if not fully wired.
        // Looking at other controllers might help. 
        // Let's assume standard `(req as any).user.id` pattern for now.

        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        if (!itemId) {
            return res.status(400).json({ error: "ItemId is required" });
        }

        const result = await pluggyService.syncItem(userId, itemId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to sync item" });
    }
};
