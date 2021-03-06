import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import TaskData from '../dataAccess/Task/TaskData';
import FlatData from '../dataAccess/Flat/FlatData';
import TaskModel from '../models/TaskModel';
import TaskPeriodModel from '../models/TaskPeriodModel';
import HttpException from '../utils/HttpException';
import { getLoggedUserId } from '../utils/authUser';
import { body, validationResult, param } from 'express-validator';
import PeriodData from '../dataAccess/PeriodData/PeriodData';
import logger from '../../logger';

export const generatePeriods: RequestHandler[] = [
	param('taskId').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	async (req, res, next) => {
		const taskId = (req.params.taskId as unknown) as number;
		let task: TaskModel | null;
		const signedInUserId = getLoggedUserId(req);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Invalid param.', {
					errorsArray,
				})
			);
		}

		try {
			task = await TaskData.getById(taskId);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}

		if (!task || !task.members!.includes(signedInUserId)) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - You do not have permissions to maintain this task period.'
				)
			);
		}

		try {
			const taskPeriodsResults = await PeriodData.resetTaskPeriods(
				taskId,
				signedInUserId
			);
			if (taskPeriodsResults.info === 'no-members') {
				return next(
					new HttpException(
						HttpStatus.CONFLICT,
						'No members assigned to task.'
					)
				);
			}

			const periods = await PeriodData.getFullModelsByTaskId(taskId);

			res.status(HttpStatus.CREATED).json(periods);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}
	},
];

export const getTaskPeriods: RequestHandler = async (req, res, next) => {
	const _taskId = req.params['taskId'];
	let task: TaskModel | null;
	let isFlatMember: boolean = false;
	const signedInUserId = getLoggedUserId(req);

	const taskId = parseInt(_taskId, 10);
	if (+_taskId !== taskId) {
		return next(
			new HttpException(HttpStatus.BAD_REQUEST, 'Invalid param.')
		);
	}

	try {
		task = await TaskData.getById(taskId);
		isFlatMember = task
			? await FlatData.isUserFlatMember(signedInUserId, task.flatId!)
			: false;
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}

	if (!isFlatMember) {
		return next(
			new HttpException(
				HttpStatus.UNAUTHORIZED,
				'Unauthorized access - You do not have permissions to maintain this task.'
			)
		);
	}

	try {
		const existingTaskPeriods = await PeriodData.getFullModelsByTaskId(
			taskId
		);
		res.status(HttpStatus.OK).json(existingTaskPeriods);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};

export const getUserCurrentPeriods: RequestHandler = async (req, res, next) => {
	const signedInUserId = getLoggedUserId(req);
	logger.debug('[GET] periods/current user (%s)', signedInUserId);

	try {
		const currentPeriods = await PeriodData.getUserCurrent(signedInUserId);
		res.status(HttpStatus.OK).json(currentPeriods);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};

export const completeTaskPeriod: RequestHandler[] = [
	param('id').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	param('taskId').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	async (req, res, next) => {
		const taskId = (req.params.taskId as unknown) as number;
		const id = (req.params.id as unknown) as number;
		let task: TaskModel | null;
		let period: TaskPeriodModel | null;
		const signedInUserId = getLoggedUserId(req);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(HttpStatus.BAD_REQUEST, 'Invalid param.', {
					errorsArray,
				})
			);
		}

		try {
			task = await TaskData.getById(taskId);
			period = await PeriodData.getById(id);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}

		if (
			!period ||
			!task ||
			period.taskId !== taskId ||
			!task.members?.find((x) => x === signedInUserId)
		) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - You do not have permissions to maintain this task period.'
				)
			);
		}

		if (period.completedBy) {
			return next(
				new HttpException(
					HttpStatus.CONFLICT,
					'Task Period already completed.'
				)
			);
		}

		if (!task.active) {
			return next(
				new HttpException(
					HttpStatus.CONFLICT,
					'The task to which the period is assigned is closed.'
				)
			);
		}

		const periodPart = new TaskPeriodModel({
			completedBy: signedInUserId,
			id: id,
		});

		try {
			const updatedPeriod = await PeriodData.updatePeriod(periodPart);
			res.status(200).json(updatedPeriod);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}
	},
];

export const reassignTaskPeriod: RequestHandler[] = [
	body('assignTo')
		.exists()
		.withMessage('Assigned person id is required.')
		.custom((value: any) => {
			return +value === parseInt(value, 10);
		})
		.withMessage('Wrong parameter value'),
	async (req, res, next) => {
		const _taskId = req.params['id'];
		const _periodId = req.params['periodId'];
		const assignTo = +req.body.assignTo;
		const signedInUserId = getLoggedUserId(req);
		let task: TaskModel | null;
		let period: TaskPeriodModel | null;

		const periodId = parseInt(_periodId, 10);

		const taskId = parseInt(_taskId, 10);
		if (+_taskId !== taskId || +_periodId !== periodId) {
			return next(
				new HttpException(HttpStatus.BAD_REQUEST, 'Invalid param.')
			);
		}

		try {
			task = await TaskData.getById(taskId);
			period = await PeriodData.getById(periodId);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}

		if (
			!task?.members?.find((x) => x /*.userId*/ === signedInUserId) ||
			!period ||
			period.taskId !== taskId
		) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - You do not have permissions to maintain this task period.'
				)
			);
		}

		if (period.completedBy) {
			return next(
				new HttpException(
					HttpStatus.CONFLICT,
					'Task Period already completed.'
				)
			);
		}

		if (!task.active) {
			return next(
				new HttpException(
					HttpStatus.CONFLICT,
					'The task to which the period is assigned is closed.'
				)
			);
		}

		if (task.members.every((x) => x /*.userId*/ !== assignTo)) {
			return next(
				new HttpException(
					HttpStatus.CONFLICT,
					'Task Period cannot be assigned to person which is not member of the task.'
				)
			);
		}

		const periodPart = new TaskPeriodModel({
			assignedTo: assignTo,
			id: periodId,
		});

		try {
			const updatedPeriod = await PeriodData.updatePeriod(periodPart);
			res.status(200).json(updatedPeriod);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}
	},
];
