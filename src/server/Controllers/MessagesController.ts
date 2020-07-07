import HttpStatus from 'http-status-codes';
import HttpException from '../utils/HttpException';
import { RequestHandler } from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../../logger';
import { getLoggedUser } from '../utils/authUser';
import { sendMail } from '../utils/mail';
import UserData from '../dataAccess/User/UserData';
import UserModel from '../models/UserModel';
import MessageData from '../dataAccess/Message/MessageData';
import moment from 'moment';

export const sendMessageToUser: RequestHandler[] = [
	body('title')
		.isString()
		.withMessage('That is not correct value for title.')
		.if((value: any) => typeof value == 'string')
		.trim()
		.isLength({ min: 1 })
		.withMessage('Title is required.')
		.isLength({ max: 50 })
		.withMessage('Title cannot be more than 50 chars long.'),
	body('message')
		.optional({ nullable: true })
		.isString()
		.withMessage('That is not correct value for message.')
		.trim()
		.isLength({ max: 500 })
		.withMessage('Message cannot be more than 500 chars long.'),
	async (req, res, next) => {
		const loggedUser = getLoggedUser(req);
		const message = {
			...req.body,
			sender: loggedUser.id,
		} as MessageDataModel;

		logger.http('[POST] /messages %o', message);

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

		try {
			const recipient = await UserData.getById(message.recipient);

			if (!recipient?.emailAddress) {
				throw new Error('Invalid recipient.');
			}

			const createdMessage = await MessageData.create(
				message,
				loggedUser.id
			);

			const mailData = await prepareUserMessage(
				createdMessage,
				loggedUser
			);

			await sendMail(
				recipient.emailAddress,
				mailData.subject,
				mailData.content
			);

			res.status(HttpStatus.OK).json({});
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

const prepareUserMessage = async (message: MessageModel, sender: UserModel) => {
	const subject = `FTS2020 - message from ${sender.emailAddress}`;

	const content = `<h1>${message.title}</h1>
	<p>${message.message}</p>
	<p align="right">Created at ${moment(message.date).format('LLLL')}</p>`;

	return {
		subject,
		content,
	};
};
