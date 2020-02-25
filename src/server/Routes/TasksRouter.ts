import { Router } from 'express';
import { getAll } from '../Controllers/TasksController';

const router = Router();

router.get('/', getAll);

export default router;