import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import validator from 'validator';
import { param, validationResult, body } from 'express-validator';
import { getLoggedUser, getLoggedUserId } from '../utils/authUser';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import FlatData from '../dataAccess/Flat/FlatData';
import FlatInvitationData from '../dataAccess/Flat/FlatInvitationData';
import {
	FlatInvitationStatus,
	FlatInvitationActions,
} from '../customTypes/DbTypes';
import {
	sendInvitationsToFlat,
	sendFlatInvitation,
} from '../utils/flatInvitations';
import FlatInvitationModel, {
	FlatInvitationPresentationModel,
} from '../models/FlatInvitation';
import UserData from '../dataAccess/User/UserData';
import { assertUnreachable } from '../utils/assertUnreachable';

export const getFlatInvitations: RequestHandler[] = [
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
						'Unauthorized access - You do not have permissions to invite people to this flat.'
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
					x.status === FlatInvitationStatus.CREATED ||
					x.status === FlatInvitationStatus.SEND_ERROR
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
					FlatInvitationStatus.CREATED,
					loggedUserId
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

			const invitations = await FlatInvitationData.getByFlat(flatId);
			res.status(HttpStatus.OK).json(invitations);
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
			loggedUser.id,
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
			return next(
				new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err)
			);
		}

		let hasAccess = false;
		if (invitation) {
			if (
				(action === FlatInvitationActions.CANCEL ||
					action === FlatInvitationActions.RESEND) &&
				invitation.createBy === loggedUser.id
			) {
				hasAccess = true;
			}

			if (
				!hasAccess &&
				(action === FlatInvitationActions.ACCEPT ||
					action === FlatInvitationActions.REJECT) &&
				invitation.emailAddress ===
					loggedUser.emailAddress.toLowerCase()
			) {
				hasAccess = true;
			}
		}

		if (!hasAccess) {
			return next(
				new HttpException(
					HttpStatus.UNAUTHORIZED,
					`Unauthorized access - You do not have permissions to ${action.toLocaleLowerCase()} this invitation.`
				)
			);
		}

		try {
			let status: FlatInvitationStatus | undefined;

			switch (action) {
				case FlatInvitationActions.ACCEPT:
					status = FlatInvitationStatus.ACCEPTED;
					break;
				case FlatInvitationActions.REJECT:
					status = FlatInvitationStatus.REJECTED;
					break;
				case FlatInvitationActions.CANCEL:
					status = FlatInvitationStatus.CANCELED;
					break;
				case FlatInvitationActions.RESEND:
					status = FlatInvitationStatus.PENDING;
					break;
				default:
					assertUnreachable(action);
			}

			let updatedInvitation: FlatInvitationModel | null;
			if (action === FlatInvitationActions.RESEND) {
				const flat = await FlatData.getById(invitation!.flatId);
				updatedInvitation = await sendFlatInvitation(
					invitation!,
					flat!,
					loggedUser
				);
			} else {
				if (status === FlatInvitationStatus.ACCEPTED) {
					await FlatData.addMember(
						invitation!.flatId,
						loggedUser.id,
						loggedUser.id
					);
				}
				updatedInvitation = await FlatInvitationData.update(
					invitation!.id!,
					status,
					loggedUser.id
				);
			}

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

			let hasAccess = false;
			let isOwner = false;

			if (invitation) {
				if (invitation.createBy === loggedUser.id) {
					isOwner = true;
				}

				if (
					!isOwner &&
					invitation.emailAddress ===
						loggedUser.emailAddress.toLowerCase()
				) {
					hasAccess = true;
				}
			}

			if (!hasAccess) {
				return next(
					new HttpException(
						HttpStatus.UNAUTHORIZED,
						`Unauthorized access. You do not have permissions to ${
							isOwner ? 'accept or reject ' : 'maintain'
						} this invitation.`
					)
				);
			}

			const sender = await UserData.getById(invitation!.createBy);
			const invitedPerson = await UserData.getByEmailAddress(
				invitation!.emailAddress
			);
			const flat = await FlatData.getById(invitation!.flatId);
			const flatOwner = await UserData.getById(flat!.createBy!);
			const actionPerson = invitation!.actionBy
				? await UserData.getById(invitation!.actionBy)
				: null;

			const payload = new FlatInvitationPresentationModel({
				id: invitation!.id!,
				token: invitation!.token,
				status: invitation!.status,
				sendDate: invitation!.sendDate,
				actionDate: invitation!.actionDate!,
				createAt: invitation!.createAt,
				sender: sender!,
				invitedPerson: invitedPerson
					? invitedPerson
					: invitation!.emailAddress,
				flat: flat!,
				flatOwner: flatOwner!,
				actionBy: actionPerson,
			});

			res.status(HttpStatus.OK).send(payload);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];

export const getUserInvitations: RequestHandler[] = [
	async (req, res, next) => {
		const loggedUser = getLoggedUser(req);
		logger.debug('[GET] /invitations, user (%s)', loggedUser.id);

		try {
			const invitations = await FlatInvitationData.getByUserEmail(
				loggedUser.emailAddress
			);

			res.status(HttpStatus.OK).send(invitations);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	},
];
