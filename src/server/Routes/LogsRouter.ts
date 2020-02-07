import { Router } from 'express';
import { getLogs } from '../Controllers/LogsController';
const router = Router();


router.use('/', getLogs);

export default router;