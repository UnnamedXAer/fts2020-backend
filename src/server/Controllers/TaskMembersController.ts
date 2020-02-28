import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { body, validationResult } from 'express-validator';
import { loggedUserId } from '../utils/authUser';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import FlatData from '../DataAccess/Flat/FlatData';
import TaskData from '../DataAccess/Task/TaskData';
import { TaskMemberModel } from '../Models/TaskMemberModel';

export const setMembers: RequestHandler[] = [
	body('members')
		.isArray()
		.withMessage('That are not correct values for members.')
		.custom((value: []) => value.length <= 100)
		.withMessage('Exceeded max members count (100)')
		.custom((value: []) => {
			const everyOutput = value.every(x => {
				const { userId, position } = x;
				const output =
					Number.isInteger(userId) &&
					userId > 0 &&
					Number.isInteger(position) &&
					position > 0;
				return output;
			});
			return everyOutput;
		})
		.withMessage(
			'That are not correct values for members - not an array objects with user id and position.'
		),
	async (req, res, next) => {
		const id = req.params.id;
		const members: TaskMemberModel[] = req.body.members;
		const signedInUserId = loggedUserId(req);
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
			const task = await TaskData.getById(idAsNum);
			if (
				!task ||
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
