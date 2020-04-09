import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import TaskData from '../DataAccess/Task/TaskData';
import HttpException from '../utils/HttpException';
import { getLoggedUserId } from '../utils/authUser';
import logger from '../../logger';
import { validationResult, body, param } from 'express-validator';
import { TaskPeriodUnit } from '../CustomTypes/TaskTypes';
import TaskModel from '../Models/TaskModel';
import FlatData from '../DataAccess/Flat/FlatData';

export const getFlatTasks: RequestHandler[] = [
	param('flatId').isInt().toInt(),
	async (req, res, next) => {
		const flatId = (req.params.flatId as unknown) as number;
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[GET] /flats/%s/tasks/ a user %s try to get all tasks: %o',
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

		let flatMembers: number[];
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

			flatMembers = await (await FlatData.getMembers(flatId)).map(
				(x) => x.id
			);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}

		const membersValid = members!.every((member) =>
			flatMembers.includes(member)
		);

		if (!membersValid) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - You tried to add user to task, which is not member of this flat.'
				)
			);
		}

		const notIncludedMembers: number[] = [];
		for (let i = 0; i < members!.length; i++) {
			if (!notIncludedMembers.includes(members![i])) {
				notIncludedMembers.push(members![i]);
			}
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
