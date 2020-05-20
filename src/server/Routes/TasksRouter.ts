import { Router } from 'express';
import {
	getUserTasks,
	getTaskById,
	update,
} from '../controllers/TasksController';
import { setMembers, getMembers } from '../controllers/TaskMembersController';
import {
	getTaskPeriods,
	generatePeriods,
	completeTaskPeriod,
	reassignTaskPeriod,
} from '../controllers/TaskPeriodsController';

const router = Router({ mergeParams: true });

router.get('/:id', getTaskById);
router.get('/', getUserTasks);
router.patch('/:id', update);

router.get('/:id/members', getMembers);
router.put('/:id/members', setMembers);

router.get('/:taskId/periods', getTaskPeriods);
router.put('/:taskId/periods', generatePeriods);
router.patch('/:taskId/periods/:id/complete', completeTaskPeriod);
router.patch('/:taskId/periods/:id/reassign', reassignTaskPeriod);

export default router;
