import { Router } from 'express';
import { getFlatTasks, create, deleteTask } from '../Controllers/TasksController';
import { setMembers, getMembers } from '../Controllers/TaskMembersController';
import {
	generatePeriods,
	getTaskPeriods,
	completeTaskPeriod,
	reassignTaskPeriod
} from '../Controllers/TaskPeriodsController';

const router = Router({ mergeParams: true });

router.get('/', getFlatTasks);
router.post('/', create);
router.delete('/:id', deleteTask);

router.get('/:taskId/members', getMembers);
router.put('/:taskId/members', setMembers);

router.get('/:taskId/periods', getTaskPeriods);
router.put('/:taskId/periods', generatePeriods);
router.patch('/:taskId/periods/:periodId/complete', completeTaskPeriod);
router.patch('/:taskId/periods/:periodId/reassign', reassignTaskPeriod);

export default router;
