import { Router } from 'express';
import authRouter from './AuthRouter';
import redirectRouter from './RedirectRouter';
import logsRouter from './LogsRouter';
import usersRouter from './UsersRouter';
import flatsRouter from './FlatsRouter';
import tasksRouter from './TasksRouter';
import periodsRouter from './PeriodsRouter';
import invitationsRouter from './InvitationsRouter';
import assetsRouter from './AssetsRouter';
import ensureAuthenticated from '../middleware/ensureAuthenticated';
const router = Router();

router.use('/auth', authRouter);
router.use('/redirect', redirectRouter);
router.use('/logs', logsRouter);
router.use('/users', ensureAuthenticated, usersRouter);
router.use('/flats', ensureAuthenticated, flatsRouter);
router.use('/tasks', ensureAuthenticated, tasksRouter);
router.use('/periods', ensureAuthenticated, periodsRouter);
router.use('/invitations', ensureAuthenticated, invitationsRouter);
router.use('/assets', assetsRouter);

export default router;