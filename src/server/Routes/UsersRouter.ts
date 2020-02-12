import { Router } from 'express';
import { getById } from '../Controllers/UsersController';
const router = Router();

router.get('/:id', getById);

export default router;
