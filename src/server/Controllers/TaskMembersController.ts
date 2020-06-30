import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { body, validationResult, param } from 'express-validator';
import { getLoggedUserId } from '../utils/authUser';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import FlatData from '../dataAccess/Flat/FlatData';
import TaskData from '../dataAccess/Task/TaskData';
import { TaskMemberModel } from '../models/TaskMemberModel';
import TaskModel from '../models/TaskModel';
import PeriodData from '../dataAccess/PeriodData/PeriodData';

export const getMembers: RequestHandler[] = [
	param('id').isInt().toInt(),
	async (req, res, next) => {
		const id = (req.params.id as unknown) as number;
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[GET] /tasks/%s/members user (%s) try to get members',
			id,
			signedInUserId
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(
					HttpStatus.BAD_REQUEST,
					'Invalid parameter.',
					{
						errorsArray,
					}
				)
			);
		}

		try {
			let hasAccess = true;
			const task = await TaskData.getById(id);
			if (task) {
				const isFlatMember = await FlatData.isUserFlatMember(
					signedInUserId,
					task.flatId!
				);
				if (!isFlatMember) {
					hasAccess = false;
				}
			} else {
				hasAccess = false;
			}

			if (!hasAccess) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access - You do not have permissions to maintain this task.'
					)
				);
			}

			const members = await TaskData.getMembers(id);
			res.status(HttpStatus.OK).send(members);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const setMembers: RequestHandler[] = [
	param('id').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	body('members')
		.isArray()
		.withMessage(
			'That are not correct values for members - expected an array of user ids.'
		)
		.if((value: any) => Array.isArray(value))
		.custom((value: []) => value.length <= 100)
		.withMessage('Exceeded max members (100).')
		.custom((value: []) => {
			const everyOutput = value.every(
				(x) => Number.isInteger(x) && x > 0
			);
			return everyOutput;
		})
		.withMessage(
			'That are not correct values for members - expected an array of user ids.'
		),
	async (req, res, next) => {
		let task: TaskModel | null;
		const id = (req.params.id as unknown) as number;
		const members: number[] = req.body.members;
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[PATCH] /tasks/%s/members user (%s) try to set members: %o ',
			id,
			signedInUserId,
			members
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray,
				})
			);
		}

		try {
			task = await TaskData.getById(id);
			if (
				!task ||
				!(
					(await FlatData.isUserFlatOwner(
						signedInUserId,
						task.flatId!
					)) && task.createBy === signedInUserId
				)
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

		try {
			const flatMembers = (await FlatData.getMembers(task.flatId!)).map(
				(x) => x.id
			);

			const areAllFlatMembers = members.every((x) =>
				flatMembers.includes(x)
			);

			if (!areAllFlatMembers) {
				return next(
					new HttpException(
						HttpStatus.UNPROCESSABLE_ENTITY,
						'Not all users are members of the flat for this task.'
					)
				);
			}

			await TaskData.setMembers(
				id,
				members.map(
					(x, i) =>
						new TaskMemberModel({
							position: i + 1,
							userId: x,
						})
				),
				signedInUserId
			);

			await PeriodData.resetPeriods(id, signedInUserId);

			const updatedTaskMembers = await TaskData.getMembers(id);
			res.status(HttpStatus.OK).json(updatedTaskMembers);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}
	},
];
