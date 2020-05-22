import { RequestHandler, Request } from 'express';
import HttpStatus from 'http-status-codes';
import HttpException from '../utils/HttpException';
import FlatData from '../dataAccess/Flat/FlatData';
import FlatModel from '../models/FlatModel';
import { body, validationResult, query } from 'express-validator';
import logger from '../../logger';
import { getLoggedUserId, getLoggedUser } from '../utils/authUser';
import validator from 'validator';
import UserData from '../dataAccess/User/UserData';
import UserModel from '../models/UserModel';
import moment from 'moment';
import { sendMail } from '../utils/mail';
import FlatInvitationData from '../dataAccess/Flat/FlatInvitationData';
import { FlatInvitationStatus } from '../../config/config';

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
	body('members')
		.optional()
		.isArray()
		.withMessage('That is not correct value for members')
		.if((value: any) => Array.isArray(value) && value.length > 0)
		.custom((value: []) => value.length <= 20)
		.withMessage(
			`It's rather not true that You live with more than 20 people in a flat or house.
			If I'm wrong please let me know.`
		)
		.custom((value: []) => {
			const everyOutput = value.every((x) => validator.isEmail(x));
			return everyOutput;
		})
		.withMessage(
			'That are not correct values for members - not an array of email addresses.'
		),
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

		let { description, members, name } = req.body as {
			description: string;
			members: string[];
			name: string;
		};

		try {
			const createdFlat = await FlatData.create(
				new FlatModel({
					description,
					name,
				}),
				loggedUser.id,
				members.filter((x) => x !== loggedUser.emailAddress)
			);

			res.status(HttpStatus.CREATED).json(createdFlat);
			sendInvitationsToFlat(createdFlat);
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

const sendInvitationsToFlat = async (flat: FlatModel) => {
	const owner = await UserData.getById(flat.createBy!)!;
	const invitations = (await FlatInvitationData.getByFlat(flat.id!)).filter(
		(x) => x.status === FlatInvitationStatus.NOT_SEND
	);

	invitations.forEach(async (inv) => {
		const { html, plainText } = await getEmailInvitationContent(
			inv.id!,
			inv.emailAddress,
			flat,
			owner!
		);
		try {
			await sendMail(
				inv.emailAddress,
				'FTS2020 Flat Invitation',
				html,
				plainText
			);
			await FlatInvitationData.update(
				inv.id!,
				FlatInvitationStatus.PENDING
			);
		} catch (err) {}
	});
};

const getEmailInvitationContent = async (
	invitationId: number,
	email: string,
	flat: FlatModel,
	owner: UserModel
) => {
	const DOMAIN = `http://localhost:3021`;
	const user = await UserData.getByEmailAddress(email);

	const unregisteredInfo = `If you are not a member of FTS2020 you can register.`;

	const html = `<!DOCTYPE html>
	<html lang="en">
	
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>FTS2020 Invitation</title>
	
		<style>
			.flatInfo {
				margin: 34px 16px 24px 16px;
				position: relative;
				border: 1px solid #ccc;
				box-shadow: 0 2px 3px #eee;
				padding-top: 16px;
			}
	
			.flatInfoLabel {
				padding: 4px 16px;
				position: absolute;
				left: 24px;
				top: -56px;
				border: 2px solid teal;
				box-shadow: 0 2px 3px teal;
				background-color: white;
				font-size: 2em;
			}
		</style>
	
	</head>
	
	<body>
		<h1>FTS2020</h1>
		<h3>Hello ${user ? user.userName : email}</h3>
	
		<p>You have been invited by <strong>${
			owner.emailAddress
		} <span style="color: #888;"></span>(${
		owner.userName
	})</strong> to join a flat in FTS2020 application. Click
			link below to accept or decline invitation.</p>
		<p>${unregisteredInfo}</p>
		<div class="flatInfo">
			<p class="flatInfoLabel">
				Flat
			</p>
			<h2>${flat.name}</h2>
			<p style="color: #888;">Created by: ${owner.emailAddress} ${owner.userName}</p>
			<p style="color: #888;">Created at: ${moment(flat.createAt).format('LL')}</p>
			<p>${flat.description}</p>
		</div>
	</body>
	
	</html>`;

	const plainText = `You have been invited by ${owner.emailAddress} (${owner.userName}) to join a flat in FTS2020 application.\
	Click link below to open FTS2020 webpage and decide if you want to accept or reject invitation.\
	${DOMAIN}/invitation/${invitationId}`;

	return { html, plainText };
};
