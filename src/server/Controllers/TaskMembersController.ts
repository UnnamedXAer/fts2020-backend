import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { body, validationResult } from 'express-validator';
import { getLoggedUserId } from '../utils/authUser';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import FlatData from '../DataAccess/Flat/FlatData';
import TaskData from '../DataAccess/Task/TaskData';
import { TaskMemberModel } from '../Models/TaskMemberModel';
import TaskModel from '../Models/TaskModel';

export const setMembers: RequestHandler[] = [
	body('members')
		.isArray()
		.withMessage(
			'That are not correct values for members - expected an array of objects with user id and position.'
		)
		.if((value: any) => Array.isArray(value))
		.custom((value: []) => value.length <= 100)
		.withMessage('Exceeded max members payload count (100).')
		.custom((value: []) => {
			const everyOutput = value.every(x => {
				if (x && typeof x === 'object') {
					const { userId, position } = x;
					const output =
						Number.isInteger(userId) &&
						userId > 0 &&
						Number.isInteger(position) &&
						position > 0;
					return output;
				}
				return false;
			});
			return everyOutput;
		})
		.withMessage(
			'That are not correct values for members - expected an array objects of with user id and position.'
		),
	async (req, res, next) => {
		let task: TaskModel | null;
		const id = req.params.id;
		const members: TaskMemberModel[] = req.body.members;
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[PATCH] /tasks/%s/members user (%s) try to set members: %o ',
			id,
			signedInUserId,
			members
		);

		const idAsNum = parseInt(id, 10);
		if (+id !== idAsNum) {
			return next(
				new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
			);
		}

		try {
			task = await TaskData.getById(idAsNum);
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

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map(x => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray
				})
			);
		}

		try {
			const flatMembers = await FlatData.getMembers(task.flatId!);

			const areAllFlatMembers = members.every(x =>
				flatMembers.includes(x.userId as number)
			);

			if (!areAllFlatMembers) {
				return next(
					new HttpException(
						HttpStatus.UNPROCESSABLE_ENTITY,
						'Not all users are members of given flat.'
					)
				);
			}

			const updatedMembers = await TaskData.setMembers(
				idAsNum,
				members,
				signedInUserId
			);
			res.status(HttpStatus.OK).json(updatedMembers);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}
	}
];
