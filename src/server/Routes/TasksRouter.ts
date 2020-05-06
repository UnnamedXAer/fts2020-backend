import { Router } from 'express';
import { getUserTasks } from '../controllers/TasksController';

const router = Router();

router.get('/', getUserTasks);

export default router;