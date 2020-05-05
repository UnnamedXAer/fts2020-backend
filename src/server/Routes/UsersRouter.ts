import { Router } from 'express';
import { getById, getByEmailAddress, update } from '../controllers/UsersController';
const router = Router();

router.get('/:id', getById);
router.patch('/:id', update);
router.post('/emailAddress', getByEmailAddress);

export default router;
