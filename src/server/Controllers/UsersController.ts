import { RequestHandler } from 'express';
import { check, validationResult, body } from 'express-validator';
import bcrypt from 'bcrypt';
import UserData from '../DataAccess/User/UserData';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import { UserRegisterModel } from '../Models/UserAuthModels';

export const getById: RequestHandler = async (req, res, next) => {
	logger.info('user/:id ( id: %O )', req.params['id']);
	const id = +req.params['id'];
	if (isNaN(id) || id < 1) {
		return next(new HttpException(404, 'Incorrect user Id'));
	}
	try {
		const user = await UserData.getById(id);
		const statusCode = user ? 200 : 204;
		res.status(statusCode).json(user);
	} catch (err) {
		next(new HttpException(500, err));
	}
};

export const registerUser: RequestHandler[] = [
	check('emailAddress')
		.exists()
		.withMessage('Email Address is required.')
		.isEmail()
		.custom(async value => {
			const user = await UserData.getByEmailAddress(value);
			return user !== null;
		})
		.withMessage('Email Address already in use.'),
	body(
		'password',
		'Password must be 6+ chars long, contain number and uppercase and lowercase letter.'
	)
		.matches(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/))
		.custom((value, { req }) => {
			if (value !== req.body.confirmPassword) {
				return Promise.reject(
					'Password confirmation does not match password.'
				);
			}
			return true;
		}),
	body('confirmPassword', 'Password confirmation is required.')
		.exists()
		.not()
		.isEmpty(),
	body('userName')
		.exists()
		.withMessage('User Name is required.')
		.trim()
		.escape()
		.isLength({ min: 2 })
		.withMessage('User Name must be 2+ chars long.')
		.isLength({ max: 50 })
		.withMessage('User Name must be be 50 max chars long.'),
	async (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors.array();
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray
				})
			);
		}

		const {
			emailAddress,
			password,
			confirmPassword,
			userName,
			provider = 'local'
		} = <UserRegisterModel>req.body;

		const hashedPassword = await bcrypt.hash(
			password,
			bcrypt.genSaltSync(10)
		);

		const userRegister = new UserRegisterModel(
			emailAddress,
			userName,
			hashedPassword,
			confirmPassword,
			provider
		);

		try {
			const user = await UserData.create(userRegister);
			const statusCode = user ? 200 : 204;
			res.status(statusCode).json(user);
		} catch (err) {
			next(new HttpException(500, err));
		}
	}
];
