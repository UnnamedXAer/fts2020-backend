import { Router } from 'express';
import { getFlats, create } from '../Controllers/FlatsController';
const router = Router();

router.get('/', getFlats);
router.post('/', create);

export default router;
