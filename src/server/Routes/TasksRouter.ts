import { Router } from 'express';
import { getUserTasks, getTaskById } from '../controllers/TasksController';
import { setMembers, getMembers } from '../controllers/TaskMembersController';

const router = Router();

router.get('/:id', getTaskById);
router.get('/', getUserTasks);

router.get('/:id/members', getMembers);
router.put('/:id/members', setMembers);

export default router;