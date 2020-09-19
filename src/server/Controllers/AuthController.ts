import { RequestHandler } from 'express';
import { check, validationResult, body } from 'express-validator';
import bcrypt from 'bcrypt';
import passport from 'passport';
import HttpStatus from 'http-status-codes';
import UserData from '../dataAccess/User/UserData';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import { UserRegisterModel } from '../models/UserAuthModels';
import UserModel from '../models/UserModel';
import { SESSION_DURATION } from '../../config/config';
import { getLoggedUser } from '../utils/authUser';

export const logIn: RequestHandler[] = [
	body('emailAddress')
		.exists()
		.withMessage('Email Address is required.')
		.isEmail()
		.withMessage('Invalid Email Address'),
	body('password').exists().withMessage('Password is required.'),
	(req, res, next) => {
		const { emailAddress } = req.body;
		logger.info('/auth/login: Someone trying to logIn as: %s', emailAddress);
		passport.authenticate('local', {}, (err, user, info) => {
			if (err) {
				return next(new HttpException(500, err));
			}

			if (info || !user) {
				return next(
					new HttpException(422, info ? info.message : 'Invalid credentials.')
				);
			}

			req.login(user, (err) => {
				if (err) {
					return next(new HttpException(500, err));
				}
				res.status(200).json({ user, expiresIn: SESSION_DURATION });
			});
		})(req, res, next);
	},
];

export const register: RequestHandler[] = [
	check('emailAddress')
		.exists()
		.withMessage('Email Address is required.')
		.isEmail()
		.withMessage('Invalid Email Address')
		.custom(async (value) => {
			const user = await UserData.getByEmailAddress(value);
			if (user) {
				throw new Error('Email Address already in use.');
			}
		}),
	body('password', 'Minimum 6 characters, at least one letter and one number').matches(
		new RegExp(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
	),
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
	body('avatarUrl')
		.optional()
		.if((value: any) => value !== '')
		.trim()
		.isURL()
		.withMessage('Avatar Url is not correct.'),
	async (req, res, next) => {
		logger.info('/auth/register a user try to register with data %o', {
			...req.body,
			passport: 'password - hidden',
			confirmPassword: 'password - hidden',
		});
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors.array().map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray,
				})
			);
		}

		const {
			emailAddress,
			password,
			confirmPassword,
			userName,
			avatarUrl,
			provider = 'local',
		} = <UserRegisterModel>req.body;

		const hashedPassword = await bcrypt.hash(password, bcrypt.genSaltSync(10));

		const userRegister = new UserRegisterModel(
			emailAddress,
			userName,
			hashedPassword,
			confirmPassword,
			provider,
			avatarUrl
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

			req.login(user, (err) => {
				if (err) {
					return next(new HttpException(500, err));
				}
				res.status(201).json({ user, expiresIn: SESSION_DURATION });
			});
		})(req, res, next);
	},
];

export const logOut: RequestHandler = (req, res, _) => {
	const user = req.user as UserModel | undefined;
	logger.debug('/auth/logout : User %s is about to logOut', user?.emailAddress);
	req.logout();
	res.sendStatus(200);
};

export const changePassword: RequestHandler[] = [
	body(
		'newPassword',
		'Minimum six characters, at least one letter and one number'
	).matches(new RegExp(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)),
	body('confirmPassword').custom(async (value, { req }) => {
		if (value !== req.body.newPassword) {
			throw new Error('Password confirmation does not match password.');
		}
	}),
	async (req, res, next) => {
		const signedUser = getLoggedUser(req);
		logger.info(
			'/auth/change-password user %s try to change password',
			signedUser.id
		);
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors.array().map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray,
				})
			);
		}

		const { oldPassword, newPassword } = req.body;

		let user: UserModel;
		try {
			user = (await UserData.getByEmailAddressAuth(
				signedUser.emailAddress
			)) as UserModel;
		} catch (err) {
			return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}

		const passwordMatch = await bcrypt.compare(oldPassword, user.password!);

		if (!passwordMatch) {
			return next(new HttpException(HttpStatus.UNAUTHORIZED, 'Wrong password.'));
		}

		const hashedPassword = await bcrypt.hash(newPassword, bcrypt.genSaltSync(10));

		try {
			const partialUser: Partial<UserModel> = {
				password: hashedPassword,
				id: signedUser.id,
			};

			await UserData.update(partialUser);

			res.sendStatus(HttpStatus.OK);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const githubAuthenticate = passport.authenticate('github', {
	scope: ['read:user'],
});

export const githubAuthenticateCallback: RequestHandler[] = [
	passport.authenticate('github', {
		scope: ['read:user'],
	}),
	async (req, res) => {
		const signedUser = getLoggedUser(req);
		logger.debug('[ githubAuthenticateCallback ]: user %o', signedUser);
		// return res.redirect('http://192.168.1.9:3021/auth#success');
		const txt = [
			'<!DOCTYPE html>',
			'<html lang="pl">',
			'<head>',
			'	<meta charset="UTF-8">',
			'	<meta name="viewport" content="width=device-width, initial-scale=1.0">',
			'	<title>Document</title>',
			'</head>',
			'<body>',
			'<script>',
			'window.document.body.innerHTML = `\n',
			'<h1 color="teal">FTS 2020</h1>\n',
			'<ul>\n',
			'<li>userAgent: ${navigator.userAgent}</li>\n',
			'<li>platform: ${navigator.platform}</li>\n',
			'<li>vendor: ${navigator.vendor}</li>\n',
			'</ul>\n',
			'<hr />`',
			'</script>',
			'<p>Successfully authorized by GitHub :), now click the button to go to the app</p>',
			'<script>\n',
			'	const backToAppBtnClickHandler = () => {\n',
			'		console.log(navigator.userAgent.indexOf("Android"))\n',
			'		if (navigator.userAgent.indexOf("Android") === -1) {\n',
			'			window.location.href = "http://localhost:3021/auth#success";\n',
			'		} else {\n',
			'			window.open("exp://192.168.1.9:19000/--/auth/github");\n',
			'		}\n',
			'	}\n',
			'</script>\n',
			'<button onclick="backToAppBtnClickHandler()">Go to app</button>\n',
			'<hr />',
			'</body>',
			'</html>',
		].join(' ');
		res.send(txt);
	},
];

export const googleAuthenticate = passport.authenticate('google', {
	scope: ['read:user'],
});

export const getCurrentUser: RequestHandler = (req, res, next) => {
	const signedUser = getLoggedUser(req);
	logger.debug('[ getCurrentUser ]: user %s', signedUser?.emailAddress);

	if (signedUser) {
		res.status(200).json({ user: signedUser, expiresIn: SESSION_DURATION });
	} else {
		next(new HttpException(HttpStatus.UNAUTHORIZED, 'Un-authorized access.'));
	}
};
