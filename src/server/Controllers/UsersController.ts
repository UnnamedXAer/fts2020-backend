import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import UserData from '../DataAccess/User/UserData';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import { validationResult, body, param } from 'express-validator';
import UserModel from '../Models/UserModel';
import { getLoggedUserId } from '../utils/authUser';

export const getById: RequestHandler[] = [
	param('id').isInt().toInt(),
	async (req, res, next) => {
		const id = (req.params.id as unknown) as number;

		logger.info('user/:id ( id: %O )', id);

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
			const user = await UserData.getById(id);
			delete user?.password;
			const statusCode = user ? 200 : 204;
			res.status(statusCode).json(user);
		} catch (err) {
			next(new HttpException(500, err));
		}
	},
];

export const getByEmailAddress: RequestHandler[] = [
	body('emailAddress')
		.exists()
		.withMessage('Email Address is required.')
		.isEmail()
		.withMessage('Invalid Email Address'),
	async (req, res, next) => {
		const { emailAddress } = req.body;
		logger.info('user/ ( emailAddress: %s )', emailAddress);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(
					HttpStatus.NOT_ACCEPTABLE,
					'Invalid payload.',
					{
						errorsArray,
					}
				)
			);
		}

		try {
			const user = await UserData.getByEmailAddress(emailAddress);
			const statusCode = user ? 200 : 204;
			res.status(statusCode).json(user);
		} catch (err) {
			next(new HttpException(500, err));
		}
	},
];

export const update: RequestHandler[] = [
	param('id').isInt({ gt: 0, allow_leading_zeroes: false }).toInt(),
	body('emailAddress')
		.optional()
		.isEmail()
		.withMessage('Invalid Email Address')
		.custom(async (value) => {
			const user = await UserData.getByEmailAddress(value);
			if (user) {
				throw new Error('Email Address already in use.');
			}
		}),
	body('userName')
		.optional()
		.trim()
		.isLength({ min: 2 })
		.withMessage('User Name must be 2+ chars long.')
		.isLength({ max: 50 })
		.withMessage('User Name must be be 50 max chars long.'),
	body('avatarUrl')
		.optional()
		.if((value: any) => value !== '')
		.trim()
		.isURL()
		.withMessage('Avatar Url is not correct.'),
	async (req, res, next) => {
		const id = (req.params.id as unknown) as number;
		const signedIdUserId = getLoggedUserId(req);
		logger.info(
			'[PATCH] /users/%s user(%s) try to update user with data %o',
			id,
			signedIdUserId,
			req.body
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(
					HttpStatus.UNPROCESSABLE_ENTITY,
					'Not all conditions are fulfilled.',
					{
						errorsArray,
					}
				)
			);
		}

		const { emailAddress, userName, avatarUrl } = <UserModel>req.body;

		if (!emailAddress && !userName && avatarUrl === undefined) {
			return next(
				new HttpException(
					HttpStatus.UNPROCESSABLE_ENTITY,
					'No data received.'
				)
			);
		}

		const userRegister: Partial<UserModel> = {
			id,
			emailAddress,
			userName,
			avatarUrl,
		};

		try {
			const existingUser = await UserData.getById(id);
			if (!existingUser || existingUser.id !== signedIdUserId) {
				next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access.'
					)
				);
			}

			const user = await UserData.update(userRegister);
			res.status(HttpStatus.OK).json(user);
		} catch (err) {
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}
	},
];
