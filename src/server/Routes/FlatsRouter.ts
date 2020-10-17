import { Router } from 'express';
import {
	getFlats,
	create,
	updateFlat,
	getFlat,
} from '../Controllers/FlatsController';
import {
	deleteMember,
	getMembers,
} from '../Controllers/FlatMembersController';
import flatTasksRouter from './FlatTasksRouter';
import {
	getFlatInvitations,
	inviteMembers,
} from '../Controllers/FlatInvitationsController';
const router = Router({ mergeParams: true });

router.get('/:id', getFlat);
router.get('/', getFlats);
router.post('/', create);
router.patch('/:id', updateFlat);

router.use('/:flatId/tasks', flatTasksRouter);

router.get('/:flatId/members', getMembers);
router.post('/:flatId/members/invite', inviteMembers);
router.delete('/:flatId/members', deleteMember);

router.get('/:flatId/invitations', getFlatInvitations);

export default router;
