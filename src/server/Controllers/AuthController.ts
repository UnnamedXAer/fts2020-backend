import { RequestHandler } from 'express';
import { check, validationResult, body } from 'express-validator';
import bcrypt from 'bcrypt';
import UserData from '../DataAccess/User/UserData';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import { UserRegisterModel } from '../Models/UserAuthModels';
import UserModel from '../Models/UserModel';
import passport from 'passport';
import { SESSION_DURATION } from '../../config/config';

export const logIn: RequestHandler[] = [
	body('emailAddress')
		.exists()
		.withMessage('Email Address is required.')
		.isEmail()
		.withMessage('Invalid Email Address'),
	body('password').exists(),
	(req, res, next) => {
		const { emailAddress } = req.body;
		logger.info(
			'/auth/login: Someone trying to logIn as: %s',
			emailAddress
		);
		passport.authenticate('local', {}, (err, user, info) => {
			if (err) {
				return next(new HttpException(500, err));
			}

			if (info || !user) {
				return next(
					new HttpException(
						422,
						info ? info.message : 'Invalid credentials.'
					)
				);
			}

			req.login(user, err => {
				if (err) {
					return next(new HttpException(500, err));
				}
				res.status(200).json({ user, expiresIn: SESSION_DURATION });
			});
		})(req, res, next);
	}
];

export const register: RequestHandler[] = [
	check('emailAddress')
		.exists()
		.withMessage('Email Address is required.')
		.isEmail()
		.withMessage('Invalid Email Address')
		.custom(async value => {
			const user = await UserData.getByEmailAddress(value);
			if (user) {
				throw new Error('Email Address already in use.');
			}
		}),
	body(
		'password',
		// 'Password must be 6+ chars long, contain number and uppercase and lowercase letter.'
		'Minimum eight characters, at least one letter and one number'
	).matches(new RegExp(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)),
	// new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
	body('confirmPassword').custom(async (value, { req }) => {
		if (value !== req.body.password) {
			throw new Error('Password confirmation does not match password.');
		}
	}),
	body('userName')
		.trim()
		.escape()
		.isLength({ min: 2 })
		.withMessage('User Name must be 2+ chars long.')
		.isLength({ max: 50 })
		.withMessage('User Name must be be 50 max chars long.'),
	async (req, res, next) => {
		logger.info('/auth/register a user try to register with data %o', {
			...req.body,
			passport: 'password - hidden',
			confirmPassword: 'password - hidden'
		});
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

		let user: UserModel;
		try {
			user = await UserData.create(userRegister);
		} catch (err) {
			return next(new HttpException(500, err));
		}

		logger.info('/auth/register new user is created, %o', user);

		passport.authenticate('local', {}, (err, user, info) => {
			if (err) {
				return next(new HttpException(500, err));
			}
			if (info || !user)
				return next(
					new HttpException(
						422,
						info.message ? info.message : 'Invalid credentials.'
					)
				);

			req.login(user, err => {
				if (err) {
					return next(new HttpException(500, err));
				}
				res.status(201).json({ user, expiresIn: SESSION_DURATION });
			});
		})(req, res, next);
	}
];

export const logOut: RequestHandler = (req, res, _) => {
	const user: UserModel = req.user as UserModel;
	logger.debug(
		'/auth/logout : User %s is about to logOut',
		user.emailAddress
	);
	req.logout();
	res.sendStatus(200);
};
