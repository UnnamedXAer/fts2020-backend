import { Router } from 'express';
import { getFlats, create, deleteFlat } from '../Controllers/FlatsController';
import { addMembers, deleteMembers } from '../Controllers/FlatMembersController';
const router = Router();

router.get('/', getFlats);
router.post('/', create);
router.delete('/:id', deleteFlat);

router.put('/:id/members', addMembers);
router.delete('/:id/members', deleteMembers);

export default router;
