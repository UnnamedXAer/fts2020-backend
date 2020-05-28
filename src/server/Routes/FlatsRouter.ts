import { Router } from 'express';
import { getFlats, create, deleteFlat } from '../controllers/FlatsController';
import {
	inviteMembers,
	deleteMembers,
	getMembers,
	getInvitations,
} from '../controllers/FlatMembersController';
import flatTasksRouter from './FlatTasksRouter';
const router = Router({ mergeParams: true });

router.get('/', getFlats);
router.post('/', create);
router.delete('/:id', deleteFlat);

router.use('/:flatId/tasks', flatTasksRouter);

router.get('/:flatId/members', getMembers);
router.post('/:flatId/members/invite', inviteMembers);
router.delete('/:flatId/members', deleteMembers);

router.get('/:flatId/invitations', getInvitations);

export default router;
