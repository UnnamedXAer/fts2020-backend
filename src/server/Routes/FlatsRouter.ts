import { Router } from 'express';
import {
	getFlats,
	create,
	deleteFlat,
	getFlat,
} from '../controllers/FlatsController';
import {
	deleteMembers,
	getMembers,
} from '../controllers/FlatMembersController';
import flatTasksRouter from './FlatTasksRouter';
import {
	getFlatInvitations,
	inviteMembers,
} from '../controllers/FlatInvitationsController';
const router = Router({ mergeParams: true });

router.get('/:id', getFlat);
router.get('/', getFlats);
router.post('/', create);
router.delete('/:id', deleteFlat);

router.use('/:flatId/tasks', flatTasksRouter);

router.get('/:flatId/members', getMembers);
router.post('/:flatId/members/invite', inviteMembers);
router.delete('/:flatId/members', deleteMembers);

router.get('/:flatId/invitations', getFlatInvitations);

export default router;
