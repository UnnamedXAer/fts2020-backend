import { Router } from 'express';
import { getUserCurrentPeriods } from '../controllers/TaskPeriodsController';
const router = Router();

router.get('/current', getUserCurrentPeriods);

export default router;
