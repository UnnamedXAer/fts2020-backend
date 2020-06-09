import { Router } from 'express';
import {
	updateFlatInvitationStatus,
	getInvitationsPresentation,
} from '../controllers/FlatMembersController';
const router = Router({ mergeParams: true });

router.get('/:token', getInvitationsPresentation);
router.patch('/:id', updateFlatInvitationStatus);

export default router;
