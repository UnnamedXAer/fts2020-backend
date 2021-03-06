import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { body, validationResult, param } from 'express-validator';
import logger from '../../logger';
import { getLoggedUserId } from '../utils/authUser';
import HttpException from '../utils/HttpException';
import FlatData from '../dataAccess/Flat/FlatData';
import FlatModel from '../models/FlatModel';

export const getMembers: RequestHandler[] = [
	param('flatId').isInt().toInt(),
	async (req, res, next) => {
		const flatId = (req.params.flatId as unknown) as number;
		logger.debug(
			'[GET] /flats/%s/members user (%s) try to members',
			flatId,
			getLoggedUserId(req)
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
			const members = await FlatData.getMembers(flatId);
			res.status(HttpStatus.OK).send(members);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const deleteMember: RequestHandler[] = [
	param('flatId').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	body('userId').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	async (req, res, next) => {
		const { flatId } = (req.params as unknown) as {
			flatId: number;
		};
		const { userId } = (req.body as unknown) as { userId: number };
		let flat: FlatModel | null;
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[DELETE] /flats/%s/members/ userId: %s loggedUser: %s',
			flatId,
			userId,
			signedInUserId
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param', {
					errorsArray,
				})
			);
		}

		try {
			flat = await FlatData.getById(flatId);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}

		if (!flat || !flat.members!.includes(signedInUserId)) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - You do not have permissions to maintain this flat.'
				)
			);
		}

		if (userId !== signedInUserId && signedInUserId !== flat.createBy) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - You do not have permissions to remove other members.'
				)
			);
		}

		if (flat.createBy === userId) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - Flat owner cannot be removed from flat members.'
				)
			);
		}

		try {
			await FlatData.deleteMember(flatId, userId, signedInUserId);
			res.sendStatus(HttpStatus.OK);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];
