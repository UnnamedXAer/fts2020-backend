import { Router } from 'express';
import { getFlats } from '../Controllers/FlatsController';
const router = Router();

router.get('/', getFlats);

export default router;
