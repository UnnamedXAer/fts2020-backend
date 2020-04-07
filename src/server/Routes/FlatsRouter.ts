import { Router } from 'express';
import { getFlats, create, deleteFlat } from '../Controllers/FlatsController';
import { addMembers, deleteMembers, getMembers } from '../Controllers/FlatMembersController';
import tasksRouter from './TasksRouter';
const router = Router({ mergeParams: true });

router.get('/', getFlats);
router.post('/', create);
router.delete('/:id', deleteFlat);

router.use('/:flatId/tasks', tasksRouter);

router.get('/:flatId/members', getMembers);
router.patch('/:flatId/members', addMembers);
router.delete('/:flatId/members', deleteMembers);

export default router;
