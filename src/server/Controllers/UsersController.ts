import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import UserData from '../DataAccess/User/UserData';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import { check, validationResult } from 'express-validator';

export const getById: RequestHandler = async (req, res, next) => {
	logger.info('user/:id ( id: %O )', req.params['id']);
	const id = +req.params['id'];
	if (isNaN(id) || id < 1) {
		return next(
			new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
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
};

export const getByEmailAddress: RequestHandler[] = [
	check('emailAddress')
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
				.map(x => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(
					HttpStatus.NOT_ACCEPTABLE,
					'Invalid payload.',
					{
						errorsArray
					}
				)
			);
		}

		try {
			const user = await UserData.getByEmailAddress(emailAddress);
			const statusCode = user ? 200 : 204;
			delete user?.password;
			res.status(statusCode).json(user);
		} catch (err) {
			next(new HttpException(500, err));
		}
	}
];
