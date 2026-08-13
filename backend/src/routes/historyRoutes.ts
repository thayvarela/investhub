import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getHistory, getReturns, exportHistory } from '../controllers/historyController';

const router = Router();

router.use(authMiddleware);

router.get('/', getHistory);
router.get('/returns', getReturns);
router.get('/export', exportHistory);

export default router;

