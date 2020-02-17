import { Router } from 'express';
import authRouter from './AuthRouter';
import logsRouter from './LogsRouter';
import usersRouter from './UsersRouter';
import flatsRouter from './FlatsRouter';
import ensureAuthenticated from '../middleware/ensureAuthenticated';
const router = Router();

router.use('/auth', authRouter);
router.use('/logs', logsRouter);
router.use('/users', ensureAuthenticated, usersRouter);
router.use('/flats', ensureAuthenticated, flatsRouter);

export default router;
