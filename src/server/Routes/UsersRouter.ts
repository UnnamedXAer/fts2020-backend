import { Router } from 'express';
import { getById, getByEmailAddress, update } from '../Controllers/UsersController';
import ensureAuthenticated from '../middleware/ensureAuthenticated';
const router = Router();

router.get('/:id', ensureAuthenticated, getById);
router.patch('/:id', ensureAuthenticated, update);
router.get('/', ensureAuthenticated, getByEmailAddress);

export default router;
