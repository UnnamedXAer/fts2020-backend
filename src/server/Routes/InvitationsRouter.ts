import { Router } from 'express';
import {
	getInvitationsPresentation,
	updateFlatInvitationStatus,
	getUserInvitations,
} from '../controllers/FlatInvitationsController';
const router = Router({ mergeParams: true });

router.get('/:token', getInvitationsPresentation);
router.get('/', getUserInvitations);
router.patch('/:id', updateFlatInvitationStatus);

export default router;
