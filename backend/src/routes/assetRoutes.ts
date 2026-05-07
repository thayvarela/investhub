import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getAssets, createAsset, updateAsset, deleteAsset, batchUpdateAssets, refreshAssetPrice, getAssetPrice, searchAssets, getQuotes } from '../controllers/assetController';

const router = Router();

router.use(authMiddleware);

router.get('/', getAssets);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

router.post('/batch', batchUpdateAssets);
router.post('/:id/refresh', refreshAssetPrice);
router.get('/ticker/:ticker', getAssetPrice);
router.get('/search', searchAssets);
router.get('/quotes', getQuotes);


export default router;
