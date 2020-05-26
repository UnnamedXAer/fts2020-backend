import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { body, validationResult, param } from 'express-validator';
import moment from 'moment';
import validator from 'validator';
import logger from '../../logger';
import { getLoggedUserId } from '../utils/authUser';
import HttpException from '../utils/HttpException';
import FlatData from '../dataAccess/Flat/FlatData';
import FlatModel from '../models/FlatModel';
import UserData from '../dataAccess/User/UserData';
import FlatInvitationData from '../dataAccess/Flat/FlatInvitationData';
import { FlatInvitationStatus } from '../../config/config';
import { sendMail } from '../utils/mail';
import UserModel from '../models/UserModel';

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

export const inviteMembers: RequestHandler[] = [
	param('flatId').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	body('members')
		.isArray({ min: 1 })
		.withMessage(
			'Property "members" must be not empty array of email addresses.'
		)
		.custom((value: any[]) => value.length <= 20)
		.withMessage(
			`It's rather not true that You live with more than 20 people in a flat or house.
			If I'm wrong please let me know.`
		)
		.custom((value: []) => {
			const everyOutput = value.every((x) => validator.isEmail(x));
			return everyOutput;
		})
		.withMessage(
			'Property "members" must be not empty array of email addresses.'
		),
	async (req, res, next) => {
		const flatId = (req.params.flatId as unknown) as number;
		const { members: emails } = req.body as { members: string[] };
		const loggedUserId = getLoggedUserId(req);
		logger.debug(
			'[PATCH] /flats/%s/invite-members user (%s) is about to invite members: %o',
			flatId,
			loggedUserId,
			emails
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));

			const paramIdx = errorsArray.findIndex((x) => x.param === 'flatId');
			return next(
				new HttpException(
					paramIdx === -1
						? HttpStatus.UNPROCESSABLE_ENTITY
						: HttpStatus.BAD_REQUEST,
					paramIdx === -1
						? 'Not all conditions are fulfilled.'
						: 'Invalid param.',
					{
						errorsArray,
					}
				)
			);
		}

		try {
			const flat = await FlatData.getById(flatId);
			if (flat?.createBy !== loggedUserId) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access - You do not have permissions to maintain this flat.'
					)
				);
			}

			const flatMembers = (await FlatData.getMembers(flatId)).map(
				(x) => x.emailAddress
			);
			const flatInvitations = (
				await FlatInvitationData.getByFlat(flatId)
			).filter((x) => {
				return (
					x.status === FlatInvitationStatus.CANCELED ||
					x.status === FlatInvitationStatus.EXPIRED ||
					x.status === FlatInvitationStatus.REJECTED
				);
			});

			let emailsToCreateInvs: string[] = [];
			let emailsToUpdateInvs: string[] = [];
			emails.forEach((email) => {
				if (
					flatInvitations.findIndex((x) => x.emailAddress === email)
				) {
					emailsToUpdateInvs.push(email);
				} else if (
					!emailsToCreateInvs.includes(email) &&
					!flatMembers.includes(email)
				) {
					emailsToCreateInvs.push(email);
				}
			});

			if (emailsToUpdateInvs.length > 0) {
				// await FlatInvitationData.update()
			}

			if (emailsToCreateInvs.length > 0) {
				await FlatInvitationData.create(
					flatId,
					emailsToCreateInvs,
					loggedUserId
				);
			}
			sendInvitationsToFlat(flat);

			res.sendStatus(HttpStatus.CREATED);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

const sendInvitationsToFlat = async (flat: FlatModel) => {
	const owner = await UserData.getById(flat.createBy!)!;
	const invitations = (await FlatInvitationData.getByFlat(flat.id!)).filter(
		(x) =>
			x.status === FlatInvitationStatus.NOT_SENT ||
			x.status === FlatInvitationStatus.SEND_ERROR
	);

	invitations.forEach(async (inv) => {
		let sendSuccessfully: boolean = false;

		try {
			const recipient = await UserData.getByEmailAddress(
				inv.emailAddress
			);

			const { html, plainText } = await getEmailInvitationContent(
				inv.id!,
				inv.emailAddress,
				flat,
				owner!,
				recipient
			);
			await sendMail(
				inv.emailAddress,
				'FTS2020 Flat Invitation',
				html,
				plainText
			);
			sendSuccessfully = true;
			await FlatInvitationData.update(
				inv.id!,
				FlatInvitationStatus.PENDING
			);
		} catch (err) {
			if (sendSuccessfully) {
				try {
					await FlatInvitationData.update(
						inv.id!,
						FlatInvitationStatus.SEND_ERROR
					);
				} catch (err) {}
			}
		}
	});
};

const getEmailInvitationContent = (
	invitationId: number,
	email: string,
	flat: FlatModel,
	owner: UserModel,
	recipient: UserModel | null
) => {
	const DOMAIN = `http://localhost:3021`;
	const unregisteredInfo = `If you are not a member of FTS2020 you can register.`;

	const html = `<div style="
		font-size: 1.1em;
		width: 90%; 
		max-width: 768px;
		min-width: 300px; 
		margin: auto; 
		font-family: sans-serif
	">
		<a href="https://fts2020/" target="blank">
			<h1 style="text-align: center; width: 100%; color: #009688;">FTS2020</h1>
		</a>
		<h2>Hello ${recipient && recipient.userName ? recipient.userName : email}</h2>

		<p>You have been invited by <strong>${
			owner.emailAddress
		} <span style="color: #888;"></span>(${
		owner.userName
	})</strong> to join a flat in <strong>FTS2020</strong> application.</p>
		<p>Click <a href="https://fts2020/invitation/12" target="blank" title="Open FTS2020 web page.">here</a>
			to
			view invitation and decide if <a href="https://fts2020/invitation/12/accept" target="blank"
				title="Accept and join to flat.">accept</a> or <a href="https://fts2020/invitation/12/decline"
				target="blank" title="Reject.">decline</a> it.</p>
		<p>${unregisteredInfo}</p>
		<p>If you are not yet member of <strong>FTS2020</strong> <a href="https://fts2020/invitation/12" target="blank"
				title="Open FTS2020 web page.">here</a> you can sign up.</p>
		<div style="
				margin: 34px 16px 24px 16px; 
				/* position: relative; */
				/* border: 1px solid #ccc;  */
				/* box-shadow: 0 2px 3px #eee;  */
				padding: 16px;
				padding: 4px 16px;
				border: 2px solid teal;
				box-shadow: 0 2px 3px teal;
				background-color: white;
			">
			<h2>${flat.name}</h2>
			<hr />
			<p style="color: #888;">Created by: ${owner.emailAddress} ${owner.userName}</p>
			<p style="color: #888;">Created at: ${moment(flat.createAt).format('LL')}</p>
			<hr />
			<p>${flat.description}</p>
		</div>
	</div>`;

	const plainText = `You have been invited by ${owner.emailAddress} (${owner.userName}) to join a flat in FTS2020 application.\
	Click link below to open FTS2020 webpage and decide if you want to accept or reject invitation.\
	${DOMAIN}/invitation/${invitationId}`;

	return { html, plainText };
};
