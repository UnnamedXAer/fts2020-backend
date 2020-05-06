import { Router } from 'express';
import { getFlats, create, deleteFlat } from '../controllers/FlatsController';
import { addMembers, deleteMembers, getMembers } from '../controllers/FlatMembersController';
import flatTasksRouter from './FlatTasksRouter';
const router = Router({ mergeParams: true });

router.get('/', getFlats);
router.post('/', create);
router.delete('/:id', deleteFlat);

router.use('/:flatId/tasks', flatTasksRouter);

router.get('/:flatId/members', getMembers);
router.patch('/:flatId/members', addMembers);
router.delete('/:flatId/members', deleteMembers);

export default router;
