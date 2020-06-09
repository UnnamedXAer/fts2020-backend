import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { body, validationResult, param } from 'express-validator';
import validator from 'validator';
import logger from '../../logger';
import { getLoggedUserId, getLoggedUser } from '../utils/authUser';
import HttpException from '../utils/HttpException';
import FlatData from '../dataAccess/Flat/FlatData';
import FlatInvitationData from '../dataAccess/Flat/FlatInvitationData';
import { sendInvitationsToFlat } from '../utils/flatInvitations';
import {
	FlatInvitationStatus,
	FlatInvitationActions,
} from '../customTypes/DbTypes';
import FlatInvitationModel from '../models/FlatInvitation';
import UserData from '../dataAccess/User/UserData';

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

export const getInvitations: RequestHandler[] = [
	param('flatId').isInt().toInt(),
	async (req, res, next) => {
		const flatId = (req.params.flatId as unknown) as number;
		const loggedUser = getLoggedUser(req);
		logger.debug(
			'[GET] /flats/%s/invitations user (%s) try to invitations',
			flatId,
			loggedUser.id
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
			const membersIds = (await FlatData.getMembers(flatId)).map(
				(x) => x.id
			);
			if (!membersIds.includes(loggedUser.id)) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access. You do not have permissions to maintain this flat.'
					)
				);
			}

			const invitations = await FlatInvitationData.getByFlat(flatId);
			res.status(HttpStatus.OK).send(invitations);
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
		logger.http(
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
					x.status === FlatInvitationStatus.REJECTED ||
					x.status === FlatInvitationStatus.CREATED
				);
			});

			let emailsToCreateInvs: string[] = [];
			let invIdsToUpdate: number[] = [];
			emails.forEach((email) => {
				const invitationId = flatInvitations.find(
					(x) => x.emailAddress === email
				)?.id;

				if (invitationId !== void 0) {
					invIdsToUpdate.push(invitationId);
				} else if (
					!emailsToCreateInvs.includes(email) &&
					!flatMembers.includes(email)
				) {
					emailsToCreateInvs.push(email);
				}
			});

			for (let i = invIdsToUpdate.length - 1; i >= 0; i--) {
				await FlatInvitationData.update(
					invIdsToUpdate[i],
					FlatInvitationStatus.CREATED
				);
			}

			if (emailsToCreateInvs.length > 0) {
				await FlatInvitationData.create(
					flatId,
					emailsToCreateInvs,
					loggedUserId
				);
			}
			sendInvitationsToFlat(flat.id!);

			res.sendStatus(HttpStatus.CREATED);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const updateFlatInvitationStatus: RequestHandler[] = [
	param('id').isInt({ allow_leading_zeroes: false, gt: -1 }).toInt(),
	body('action')
		.isIn(Object.keys(FlatInvitationActions))
		.withMessage('Not correct value for "action" property.'),
	async (req, res, next) => {
		const id = (req.params.id as unknown) as number;
		const action = req.body.action as FlatInvitationActions;
		const loggedUser = getLoggedUser(req);
		let invitation: FlatInvitationModel | null = null;
		logger.http(
			'[PATCH] /invitations/%s/answer user (%s), action: %s',
			id,
			loggedUser,
			id,
			action
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(HttpStatus.BAD_REQUEST, 'Invalid property.', {
					errorsArray,
				})
			);
		}

		try {
			invitation = await FlatInvitationData.getById(id);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}

		if (
			!(
				invitation &&
				((action === FlatInvitationActions.CANCEL &&
					invitation.createBy === loggedUser.id) ||
					((action === FlatInvitationActions.ACCEPT ||
						action === FlatInvitationActions.REJECT) &&
						invitation.emailAddress === loggedUser.emailAddress))
			)
		) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					'Unauthorized access - You do not have permissions to perform this invitation action.'
				)
			);
		}

		try {
			let status: FlatInvitationStatus | undefined;
			if (action === FlatInvitationActions.ACCEPT)
				status = FlatInvitationStatus.ACCEPTED;
			else if (action === FlatInvitationActions.REJECT)
				status = FlatInvitationStatus.REJECTED;
			else if (action === FlatInvitationActions.CANCEL)
				status = FlatInvitationStatus.CANCELED;

			if (!status) {
				throw new Error(
					'Unrecognized "Status" for inv: ' + invitation.id
				);
			}

			if (status === FlatInvitationStatus.ACCEPTED) {
				await FlatData.addMember(
					invitation.flatId,
					loggedUser.id,
					loggedUser.id
				);
			}

			const updatedInvitation = await FlatInvitationData.update(
				invitation.id!,
				status
			);

			res.status(HttpStatus.OK).json(updatedInvitation);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const getInvitationsPresentation: RequestHandler[] = [
	param('token').isUUID(4),
	async (req, res, next) => {
		const { token } = (req.params as unknown) as {
			token: string;
		};
		const loggedUser = getLoggedUser(req);
		logger.debug('[GET] /invitations/%s, user (%s)', token, loggedUser.id);

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
			const invitation = await FlatInvitationData.getByToken(token);

			if (
				!invitation ||
				invitation.emailAddress !== loggedUser.emailAddress ||
				invitation.createBy !== loggedUser.id
			) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						'Unauthorized access. You do not have permissions to maintain this invitation.'
					)
				);
			}

			const sender = await UserData.getById(invitation.createBy);
			const invitedPerson = await UserData.getByEmailAddress(
				invitation.emailAddress
			);
			const flat = await FlatData.getById(invitation.flatId);
			const flatOwner = await UserData.getById(flat!.createBy!);

			const payload = {
				id: invitation.id,
				status: invitation.status,
				sendDate: invitation.sendDate,
				actionDate: invitation.actionDate,
				createAt: invitation.createAt,
				sender: sender,
				invitedPerson: invitedPerson
					? invitedPerson
					: invitation.emailAddress,
				flat: flat,
				flatOwner,
			};

			res.status(HttpStatus.OK).send(payload);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];
