import { Router } from 'express';
import { getScreenByName } from '../Controllers/AssetsController';
const router = Router();

router.get('/screen/:screenName', getScreenByName);

export default router;
