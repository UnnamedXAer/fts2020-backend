import { RequestHandler, Request } from 'express';
import HttpStatus from 'http-status-codes';
import HttpException from '../utils/HttpException';
import FlatData from '../dataAccess/Flat/FlatData';
import FlatModel from '../models/FlatModel';
import { body, validationResult, query, param } from 'express-validator';
import logger from '../../logger';
import { getLoggedUserId, getLoggedUser } from '../utils/authUser';

export const getFlats: RequestHandler[] = [
	query('userId')
		.exists()
		.withMessage('Missing userId parameter')
		.if((value: any) => value !== undefined)
		.isInt()
		.toInt(),
	async (req, res, next) => {
		const loggedUserId = getLoggedUserId(req);
		logger.debug(
			'[GET] /flats/ a user %s try to get all flats: %o',
			loggedUserId
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

		const userId = req.query.userId;

		try {
			const flats = await FlatData.getByMember(userId);

			res.status(HttpStatus.OK).send(flats);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const getFlat: RequestHandler[] = [
	param('id').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	async (req, res, next) => {
		const id = (req.params.id as unknown) as number;
		const loggedUserId = getLoggedUserId(req);
		logger.debug(
			'[GET] /flats/%s a user %s try to get all flats: %s',
			id,
			loggedUserId
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(
					HttpStatus.UNPROCESSABLE_ENTITY,
					'Invalid parameter.',
					{
						errorsArray,
					}
				)
			);
		}

		try {
			const flat = await FlatData.getById(id);
			if (flat) {
				res.status(HttpStatus.OK).send(flat);
			} else {
				res.sendStatus(HttpStatus.NO_CONTENT);
			}
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const create: RequestHandler[] = [
	body('name')
		.isString()
		.withMessage('That is not correct value for name')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Name must be 2+ chars long.')
		.isLength({ max: 50 })
		.withMessage('Name cannot be more than 50 chars long.')
		.custom(async (value: string, { req }) => {
			try {
				const exists = await FlatData.verifyIfMember(
					getLoggedUserId(<Request>req),
					value
				);
				if (exists) {
					throw new Error(
						'You are already member of flat with this name.'
					);
				}
			} catch (err) {
				const errorMessage =
					process.env.NODE_ENV == 'development'
						? err.message
						: 'Something went wrong during validation.';
				throw new Error(errorMessage);
			}
		}),
	body('description')
		.if((value: any) => {
			console.log('description', value);
			return typeof value === 'string' && value.trim().length > 0;
		})
		.trim()
		.isLength({ max: 500 })
		.withMessage('description cannot be more than 500 chars long.'),
	async (req, res, next) => {
		const loggedUser = getLoggedUser(req);
		logger.debug(
			'[POST] /flats/ user (%s) try to create flat: %o',
			loggedUser.id,
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
				})
			);
		}

		let { description, name } = req.body as {
			description: string;
			name: string;
		};

		try {
			const createdFlat = await FlatData.create(
				new FlatModel({
					description,
					name,
				}),
				loggedUser
			);

			res.status(HttpStatus.CREATED).json(createdFlat);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const deleteFlat: RequestHandler = async (req, res, next) => {
	const { id } = req.params;
	const signedInUserId = getLoggedUserId(req);
	logger.debug(
		'[DELETE] /flats/ user (%s) try to delete flat: %s',
		signedInUserId,
		id
	);

	const idAsNum = parseInt(id, 10);
	if (+id !== idAsNum) {
		return next(
			new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
		);
	}

	try {
		if (!(await FlatData.isUserFlatOwner(signedInUserId, idAsNum))) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - You do not have permissions to maintain this flat.'
				)
			);
		}

		await FlatData.delete(idAsNum, signedInUserId);
		res.sendStatus(HttpStatus.OK);
	} catch (err) {
		next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};
