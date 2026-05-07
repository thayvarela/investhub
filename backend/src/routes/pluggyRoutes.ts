import { Router } from 'express';
import * as pluggyController from '../controllers/pluggyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply Auth Middleware to all pluggy routes
router.use(authMiddleware);

router.post('/token', pluggyController.getConnectToken);
router.post('/sync', pluggyController.syncItem);

export default router;
