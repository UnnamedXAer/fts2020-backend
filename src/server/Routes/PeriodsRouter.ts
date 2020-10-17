import { Router } from 'express';
import { getUserCurrentPeriods } from '../Controllers/TaskPeriodsController';
const router = Router();

router.get('/current', getUserCurrentPeriods);

export default router;
