import { Router } from 'express';
import { getLogs } from '../controllers/LogsController';
const router = Router();


router.get('/', getLogs);

export default router;