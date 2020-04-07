import { Router } from 'express';
import { getFlatTasks, create, deleteTask } from '../Controllers/TasksController';
import { setMembers } from '../Controllers/TaskMembersController';
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

router.put('/:id/members', setMembers);

router.get('/:id/periods', getTaskPeriods);
router.put('/:id/periods', generatePeriods);
router.patch('/:id/periods/:periodId/complete', completeTaskPeriod);
router.patch('/:id/periods/:periodId/reassign', reassignTaskPeriod);

export default router;
