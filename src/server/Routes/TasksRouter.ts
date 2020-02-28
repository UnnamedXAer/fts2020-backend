import { Router } from 'express';
import { getAll, create, deleteTask } from '../Controllers/TasksController';
import { setMembers } from '../Controllers/TaskMembersController';

const router = Router();

router.get('/', getAll);
router.post('/', create);
router.delete('/:id', deleteTask);

router.patch('/:id/members', setMembers)

export default router;
