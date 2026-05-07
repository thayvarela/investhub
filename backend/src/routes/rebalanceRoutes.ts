import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { saveTargets, getTargets } from '../controllers/rebalanceController';

const router = Router();

router.use(authMiddleware);

router.post('/targets', saveTargets);
router.get('/targets', getTargets); // Optional but useful

export default router;
