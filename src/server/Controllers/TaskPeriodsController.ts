import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import TaskData from '../DataAccess/Task/TaskData';
import FlatData from '../DataAccess/Flat/FlatData';
import TaskModel from '../Models/TaskModel';
import TaskPeriodModel from '../Models/TaskPeriodModel';
import HttpException from '../utils/HttpException';
import { loggedUserId } from '../utils/authUser';
import { updateDates } from '../utils/TaskTimePeriod';

export const generatePeriods: RequestHandler = async (req, res, next) => {
	const _taskId = req.params['id'];
	let task: TaskModel | null;
	const signedInUserId = loggedUserId(req);
	let periodsAlreadyGenerated: boolean;

	const taskId = parseInt(_taskId, 10);
	if (+_taskId !== taskId) {
		return next(
			new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
		);
	}

	try {
		task = await TaskData.getById(taskId);
		const existingTaskPeriods = await TaskData.getTaskPeriodsByTaskId(taskId);
		periodsAlreadyGenerated = existingTaskPeriods.length > 0;
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}

	if (
		!task ||
		task.createBy !== signedInUserId ||
		!(await FlatData.isUserFlatOwner(signedInUserId, task.flatId!))
	) {
		return next(
			new HttpException(
				HttpStatus.UNAUTHORIZED,
				'Unauthorized access - You do not have permissions to maintain this task.'
			)
		);
	}

	if (periodsAlreadyGenerated) {
		return next(
			new HttpException(
				HttpStatus.CONFLICT,
				'Periods are already generated for this task.'
			)
		);
	}
	const taskPeriods: TaskPeriodModel[] = [];
	const taskMembers = task.members;
	if (!taskMembers || taskMembers.length === 0) {
		return res.status(200).json('No members assigned to task.');
	}

	taskMembers.sort((a, b) => a.position! - b.position!);

	const membersLen = taskMembers.length;
	let startDate = task.startDate!;
	const endDate = task.endDate!;
	const periodUnit = task.timePeriodUnit!;
	const periodValue = task.timePeriodValue!;
	let membersIndex = 0;

	for (let i = 0; i < 30; i++) {
		if (membersIndex === membersLen) {
			membersIndex = 0;
		}
		const assignTo = taskMembers[membersIndex++].userId;
		const { currentStartDate, currentEndDate } = updateDates(
			periodUnit,
			periodValue,
			startDate,
			i
		);

		const period = new TaskPeriodModel({
			assignedTo: assignTo,
			startDate: currentStartDate,
			endDate: currentEndDate,
			taskId: taskId
		});
		taskPeriods.push(period);

		startDate = currentEndDate;

		if (currentEndDate >= endDate) {
			break;
		}
	}

	try {
		const createdTimePeriods = await TaskData.addTaskPeriods(
			taskPeriods,
			taskId
		);
		res.status(HttpStatus.CREATED).json(createdTimePeriods);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};

export const getTaskPeriods: RequestHandler = async (req, res, next) => {
	const _taskId = req.params['id'];
	let task: TaskModel | null;
	const signedInUserId = loggedUserId(req);

	const taskId = parseInt(_taskId, 10);
	if (+_taskId !== taskId) {
		return next(
			new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
		);
	}

	try {
		task = await TaskData.getById(taskId);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}

	if (
		!task ||
		task.createBy !== signedInUserId ||
		!(await FlatData.isUserFlatOwner(signedInUserId, task.flatId!))
	) {
		return next(
			new HttpException(
				HttpStatus.UNAUTHORIZED,
				'Unauthorized access - You do not have permissions to maintain this task.'
			)
		);
	}

	try {
		const existingTaskPeriods = await TaskData.getTaskPeriodsByTaskId(taskId);
		res.status(HttpStatus.OK).json(existingTaskPeriods);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};

export const completeTaskPeriod: RequestHandler = async (req, res, next) => {
	const _taskId = req.params['id'];
	let task: TaskModel | null;
	const signedInUserId = loggedUserId(req);
	const _periodId = req.params['periodId'];

	const periodId = parseInt(_periodId, 10);

	const taskId = parseInt(_taskId, 10);
	if (+_taskId !== taskId || +_periodId !== periodId) {
		return next(
			new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
		);
	}

	try {
		task = await TaskData.getById(taskId);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}

	if (!task?.members!.find(x => x.userId === signedInUserId)) {
		return next(
			new HttpException(
				HttpStatus.UNAUTHORIZED,
				'Unauthorized access - You do not have permissions to maintain this task period.'
			)
		);
	}

	try {
		const period = await TaskData.completeTaskPeriod(
			periodId,
			signedInUserId
		);
		res.status(200).json(period);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};
