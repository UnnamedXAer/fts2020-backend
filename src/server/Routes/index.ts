import { Router } from 'express';
import logsRouter from './LogsRouter';
import usersRouter from './UsersRouter';
import ensureAuthenticated from '../middleware/ensureAuthenticated';
const router = Router();

router.use('/users', usersRouter);
router.use('/logs', ensureAuthenticated, logsRouter);

export default router;