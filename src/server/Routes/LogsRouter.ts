import { Router } from 'express';
import { getLogs } from '../Controllers/LogsController';
const router = Router();


router.get('/', getLogs);

export default router;