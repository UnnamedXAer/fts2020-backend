import { Router } from 'express';
import { updateFlatInvitationStatus } from '../controllers/FlatMembersController';
const router = Router({ mergeParams: true });

router.patch('/:id', updateFlatInvitationStatus);

export default router;
