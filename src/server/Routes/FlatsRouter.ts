import { Router } from 'express';
import { getFlats, create, deleteFlat, addMembers } from '../Controllers/FlatsController';
const router = Router();

router.get('/', getFlats);
router.post('/', create);
router.post('/:id/members', addMembers);
// router.delete(':id/members', deleteMembers);
router.delete('/:id', deleteFlat);

export default router;
