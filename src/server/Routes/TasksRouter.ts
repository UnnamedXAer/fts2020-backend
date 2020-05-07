import { Router } from 'express';
import { getUserTasks, getTaskById } from '../controllers/TasksController';

const router = Router();

router.get('/:id', getTaskById);
router.get('/', getUserTasks);

export default router;