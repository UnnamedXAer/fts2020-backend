import { Router } from 'express';
import { getFlatTasks, create, deleteTask } from '../controllers/TasksController';
import {
	generatePeriods,
	getTaskPeriods,
	completeTaskPeriod,
	reassignTaskPeriod
} from '../controllers/TaskPeriodsController';

const router = Router({ mergeParams: true });

router.get('/', getFlatTasks);
router.post('/', create);
router.delete('/:id', deleteTask);

router.get('/:taskId/periods', getTaskPeriods);
router.put('/:taskId/periods', generatePeriods);
router.patch('/:taskId/periods/:periodId/complete', completeTaskPeriod);
router.patch('/:taskId/periods/:periodId/reassign', reassignTaskPeriod);

export default router;
