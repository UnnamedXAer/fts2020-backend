import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import TaskData from '../DataAccess/Task/TaskData';
import HttpException from '../utils/HttpException';
import { getLoggedUserId } from '../utils/authUser';
import logger from '../../logger';
import { validationResult, body } from 'express-validator';
import { TaskPeriodUnit } from '../CustomTypes/TaskTypes';
import TaskModel from '../Models/TaskModel';
import FlatData from '../DataAccess/Flat/FlatData';

export const getAll: RequestHandler = async (req, res, next) => {
	logger.debug(
		'[GET] /tasks/ a user %s try to get all tasks: %o',
		getLoggedUserId(req)
	);
	try {
		const tasks = await TaskData.getAll();
		res.status(HttpStatus.OK).json(tasks);
	} catch (err) {
		next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};

export const create: RequestHandler[] = [
	body('flatId')
		.isInt({ gt: 0, allow_leading_zeroes: false })
		.toInt(),
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
	async (req, res, next) => {
		const signedIdUserId = getLoggedUserId(req);
		logger.debug(
			'[POST] /tasks user (%s) try to create task with following data: %o',
			signedIdUserId,
			{ ...req.body }
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map(x => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray,
					body: req.body
				})
			);
		}

		let {
			title,
			description,
			startDate,
			endDate,
			flatId,
			timePeriodUnit,
			timePeriodValue
		} = req.body as TaskModel;

		try {
			const createdFlat = await TaskData.create(
				new TaskModel({
					title,
					description,
					startDate,
					endDate,
					flatId,
					timePeriodUnit,
					timePeriodValue
				}),
				signedIdUserId
			);

			res.status(HttpStatus.CREATED).json(createdFlat);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	}
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
				!(await FlatData.isUserFlatOwner(signedInUserId, task.flatId!) && task.createBy === idAsNum )
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