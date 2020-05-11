import { Router } from 'express';
import { getFlatTasks, create, deleteTask } from '../controllers/TasksController';

const router = Router({ mergeParams: true });

router.get('/', getFlatTasks);
router.post('/', create);
router.delete('/:id', deleteTask);



export default router;
