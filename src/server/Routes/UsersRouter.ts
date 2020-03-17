import { Router } from 'express';
import { getById, getByEmailAddress } from '../Controllers/UsersController';
const router = Router();

router.get('/:id', getById);
router.post('/emailAddress', getByEmailAddress);

export default router;
