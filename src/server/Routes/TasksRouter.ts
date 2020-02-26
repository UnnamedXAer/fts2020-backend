import { Router } from 'express';
import { getAll,create } from '../Controllers/TasksController';

const router = Router();

router.get('/', getAll);
router.post('/', create);

export default router;