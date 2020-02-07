import { Router } from 'express';
import { getById } from '../Controllers/UsersController';
const router = Router();

router.use('/:id', getById);

export default router;
