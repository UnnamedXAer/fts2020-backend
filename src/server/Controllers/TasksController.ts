import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import TaskData from '../dataAccess/Task/TaskData';
import HttpException from '../utils/HttpException';
import { getLoggedUserId } from '../utils/authUser';
import logger from '../../logger';
import { validationResult, body, param } from 'express-validator';
import TaskModel from '../models/TaskModel';
import FlatData from '../dataAccess/Flat/FlatData';
import { TaskPeriodUnit } from '../../constants/dbFields';

export const getFlatTasks: RequestHandler[] = [
	param('flatId').isInt().toInt(),
	async (req, res, next) => {
		const flatId = (req.params.flatId as unknown) as number;
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[GET] /flats/%s/tasks/ a user %s try to get tasks',
			flatId,
			signedInUserId
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray,
					body: req.body,
				})
			);
		}

		try {
			const isUserFlatMember = await FlatData.isUserFlatMember(
				signedInUserId,
				flatId
			);
			if (!isUserFlatMember) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access - You do not have permissions to maintain this flat.'
					)
				);
			}

			const tasks = await TaskData.getByFlat(flatId);
			res.status(HttpStatus.OK).json(tasks);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const getUserTasks: RequestHandler[] = [
	async (req, res, next) => {
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[GET] /tasks a user %s try to get his tasks',
			signedInUserId
		);

		try {
			const tasks = await TaskData.getByUser(signedInUserId);
			res.status(HttpStatus.OK).json(tasks);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const getTaskById: RequestHandler[] = [
	param('id').isInt().toInt(),
	async (req, res, next) => {
		const id = (req.params.id as unknown) as number;
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[GET] /tasks/%s user %s try to get his task',
			id,
			signedInUserId
		);

		try {
			const task = await TaskData.getById(id);
			let hasAccess = task !== null;
			if (hasAccess) {
				if (!task!.members!.includes(signedInUserId)) {
					const flatMembers = await FlatData.getMembers(
						task!.flatId!
					);

					hasAccess = flatMembers.some(
						(x) => x.id === signedInUserId
					);
				}
			}

			if (!hasAccess) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access - You do not have permissions to maintain this task.'
					)
				);
			}

			res.status(HttpStatus.OK).json(task);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const create: RequestHandler[] = [
	param('flatId').isInt({ gt: 0, allow_leading_zeroes: false }).toInt(),
	body('title')
		.isString()
		.withMessage('That is not correct value for title.')
		.if((value: any) => typeof value == 'string')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Title must be 2+ chars long.')
		.isLength({ max: 50 })
		.withMessage('Title cannot be more than 50 chars long.'),
	body('description')
		.optional({ nullable: true })
		.isString()
		.withMessage('That is not correct value for description.')
		.trim()
		.isLength({ max: 500 })
		.withMessage('Description cannot be more than 500 chars long.'),
	body('timePeriodUnit')
		.isString()
		.withMessage('That is not correct value for Time Period Unit.')
		.isIn(Object.keys(TaskPeriodUnit)),
	body('timePeriodValue')
		.not()
		.isString()
		.withMessage('That is not correct value for Time Period Value.')
		.isInt({ max: 999, min: 1, allow_leading_zeroes: false })
		.withMessage('Time Period Value must be integer between 1 nad 999.')
		.toInt(),
	body('startDate')
		.isISO8601({ strict: true })
		.withMessage('Invalid date, not an ISO 8601 date format.'),
	body('endDate')
		.isISO8601({ strict: true })
		.withMessage('Invalid date, not an ISO 8601 date format.')
		.custom((value: string, { req }) => {
			return !(Date.parse(value) < Date.parse(req.body.startDate));
		})
		.withMessage('End Date must be later then Start Date'),
	body('members')
		.optional()
		.isArray()
		.withMessage('That is not correct value for members')
		.if((value: any) => Array.isArray(value) && value.length > 0)
		.custom((value: []) => {
			const everyOutput = value.every((x) => {
				const output = Number.isInteger(x) && x > 0;
				return output;
			});
			return everyOutput;
		})
		.withMessage(
			'That are not correct values for members - not an array of positive integers.'
		),
	async (req, res, next) => {
		const flatId = (req.params.flatId as unknown) as number;
		const signedIdUserId = getLoggedUserId(req);
		logger.debug(
			'[POST] flats/%s/tasks user (%s) try to create task with following data: %o',
			flatId,
			signedIdUserId,
			{ ...req.body }
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray,
					body: req.body,
				})
			);
		}

		let {
			title,
			description,
			startDate,
			endDate,
			timePeriodUnit,
			timePeriodValue,
			members,
		} = req.body as TaskModel;

		try {
			const isUserFlatMember = await FlatData.isUserFlatMember(
				signedIdUserId,
				flatId
			);
			if (!isUserFlatMember) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access - You do not have permissions to maintain this flat.'
					)
				);
			}
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}

		let flatMembers: number[]
		let membersValid = members === void 0;
		const notIncludedMembers: number[] = [];

		if (!membersValid) {
			try {
				flatMembers = await (await FlatData.getMembers(flatId)).map(
					(x) => x.id
				);
				membersValid = members === void 0 || members.every((member) =>
					flatMembers.includes(member)
				);

			} catch (err) {
				next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
			}

			if (!membersValid) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access - You tried to add user to task, which is not member of this flat.'
					)
				);
			}
			for (let i = 0; i < members!.length; i++) {
				if (!notIncludedMembers.includes(members![i])) {
					notIncludedMembers.push(members![i]);
				}
			}
		}

		if (!notIncludedMembers.includes(signedIdUserId)) {
			notIncludedMembers.push(signedIdUserId);
		}

		const taskToCreate = new TaskModel({
			title,
			description,
			startDate,
			endDate,
			flatId,
			timePeriodUnit,
			timePeriodValue,
			members: notIncludedMembers,
		});

		try {
			const createdFlat = await TaskData.create(
				taskToCreate,
				signedIdUserId
			);

			res.status(HttpStatus.CREATED).json(createdFlat);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const update: RequestHandler[] = [
	param('id').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	body('title')
		.optional({ nullable: true })
		.isString()
		.withMessage('That is not correct value for title.')
		.if((value: any) => typeof value == 'string')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Title must be 2+ chars long.')
		.isLength({ max: 50 })
		.withMessage('Title cannot be more than 50 chars long.'),
	body('description')
		.optional({ nullable: true })
		.isString()
		.withMessage('That is not correct value for description.')
		.trim()
		.isLength({ max: 500 })
		.withMessage('Description cannot be more than 500 chars long.'),
	body('active').optional({ nullable: true }).isBoolean(),
	async (req, res, next) => {
		const signedIdUserId = getLoggedUserId(req);
		const id = (req.params.id as unknown) as number;

		logger.debug(
			'[PATCH] flats/%s/tasks user (%s) try to update task with following data: %o',
			id,
			signedIdUserId,
			{ ...req.body }
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(
					HttpStatus.UNPROCESSABLE_ENTITY,
					'Not all conditions are fulfilled',
					{
						errorsArray,
						body: req.body,
					}
				)
			);
		}

		let { title, description, active } = req.body as TaskModel;

		try {
			const existingTask = await TaskData.getById(id);

			const flat = existingTask
				? await FlatData.getById(existingTask.flatId!)
				: null;

			if (
				!existingTask ||
				!flat ||
				(flat.createBy !== signedIdUserId &&
					existingTask.createBy !== signedIdUserId)
			) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access - You do not have permissions to maintain this task.'
					)
				);
			}
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}

		const taskData: Partial<TaskModel> = new TaskModel({
			id,
			title,
			description,
			active,
		});

		try {
			const updatedTask = await TaskData.update(taskData, signedIdUserId);

			res.status(HttpStatus.OK).json(updatedTask);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const deleteTask: RequestHandler = async (req, res, next) => {
	const { id } = req.params;
	const signedInUserId = getLoggedUserId(req);
	logger.debug(
		'[DELETE] /tasks/%s user (%s) try to delete task',
		id,
		signedInUserId
	);

	const idAsNum = parseInt(id, 10);
	if (+id !== idAsNum) {
		return next(
			new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
		);
	}

	try {
		const task = await TaskData.getById(idAsNum);
		if (task) {
			if (
				!(
					(await FlatData.isUserFlatOwner(
						signedInUserId,
						task.flatId!
					)) && task.createBy === idAsNum
				)
			) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access - You do not have permissions to maintain this flat.'
					)
				);
			}
		}

		await TaskData.delete(idAsNum, signedInUserId);
		res.sendStatus(HttpStatus.OK);
	} catch (err) {
		next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};
