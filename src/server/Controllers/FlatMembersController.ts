import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { body, validationResult, param } from 'express-validator';
import logger from '../../logger';
import { getLoggedUserId,} from '../utils/authUser';
import HttpException from '../utils/HttpException';
import FlatData from '../dataAccess/Flat/FlatData';


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

export const deleteMembers: RequestHandler[] = [
	body('members')
		.isArray({
			min: 1,
		})
		.withMessage(
			'That are not correct values for members - not an array of positive integers.'
		)
		.if((value: any) => Array.isArray(value) && value.length > 0)
		.custom((value: []) => value.length <= 100)
		.withMessage('Invalid value')
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
		const flatId = req.params.flatId;
		const members: number[] = req.body.members;
		const signedInUserId = getLoggedUserId(req);
		logger.debug(
			'[DELETE] /flats/%s/members user (%s) try to delete members: %o from flat: %s',
			flatId,
			signedInUserId,
			members,
			flatId
		);

		const flatIdAsNum = parseInt(flatId, 10);
		if (+flatId !== flatIdAsNum) {
			return next(
				new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
			);
		}

		try {
			if (
				!(await FlatData.isUserFlatOwner(signedInUserId, flatIdAsNum))
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
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray,
				})
			);
		}

		try {
			await FlatData.deleteMembers(flatIdAsNum, members, signedInUserId);
			res.sendStatus(HttpStatus.OK);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];
