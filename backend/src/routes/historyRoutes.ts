import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getHistory, getReturns } from '../controllers/historyController';

const router = Router();

router.use(authMiddleware);

router.get('/', getHistory);
router.get('/returns', getReturns);

export default router;

