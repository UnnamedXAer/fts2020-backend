import { Router } from 'express';
import { getById, registerUser } from '../Controllers/UsersController';
const router = Router();

router.get('/:id', getById);
router.post('/', registerUser);

export default router;
