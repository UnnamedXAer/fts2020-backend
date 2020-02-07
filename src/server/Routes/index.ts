import { Router } from 'express';
import logsRouter from './LogsRouter';
import usersRouter from './UsersRouter';
const router = Router();

router.use('/users', usersRouter);
router.use('/logs', logsRouter);

export default router;