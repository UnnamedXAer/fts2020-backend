import { v4 as uuidv4 } from 'uuid';
import FlatInvitationModel, {
	FlatInvitationPresentationModel,
} from '../../models/FlatInvitation';
import knex from '../../../db';
import logger from '../../../logger';
import { FlatInvitationRow } from '../../CustomTypes/DbTypes';
import UserData from '../User/UserData';
import FlatData from './FlatData';
import { db, FlatInvitationStatus } from '../../../constants/dbFields';

class FlatInvitationData {
	static async getById(id: number) {
		try {
			const results: FlatInvitationRow[] = await knex(
				'flatInvitation'
			).where({
				id,
			});
			const invitationRow = results[0];

			if (invitationRow) {
				const invitation = this.mapInvitationsDataToModel(
					invitationRow
				);
				logger.debug(
					'[FlatInvitationData].getById invitation: %o',
					invitation
				);

				return invitation;
			} else {
				logger.debug(
					'[FlatInvitationData].getById invitation with id: %s do not exists',
					id
				);
				return null;
			}
		} catch (err) {
			logger.debug('[FlatInvitationData].getById error: %o', err);
			throw err;
		}
	}

	static async getByToken(token: string) {
		try {
			const results: FlatInvitationRow[] = await knex(
				'flatInvitation'
			).where({
				token,
			});
			const invitationRow = results[0];

			if (invitationRow) {
				const invitation = this.mapInvitationsDataToModel(
					invitationRow
				);
				logger.debug(
					'[FlatInvitationData].getById invitation: %o',
					invitation
				);

				return invitation;
			} else {
				logger.debug(
					'[FlatInvitationData].getByToken invitation with token: %s do not exists',
					token
				);
				return null;
			}
		} catch (err) {
			logger.debug('[FlatInvitationData].getByToken error: %o', err);
			throw err;
		}
	}

	static async getByFlat(id: number) {
		try {
			const results: FlatInvitationRow[] = await knex('flatInvitation')
				.select(db.CommonCols.flatInvitation)
				.where({ flatId: id });

			const invitations = results.map(this.mapInvitationsDataToModel);

			logger.debug(
				'[FlatInvitationData].getByFlatId FlatId: %s, invitations count: %s',
				id,
				invitations.length
			);
			return invitations;
		} catch (err) {
			logger.debug('[FlatInvitationData].getByFlat error: %o', err);
			throw err;
		}
	}

	static async getByUserEmail(emailAddress: string) {
		try {
			const results: FlatInvitationRow[] = await knex
				.select(db.CommonCols.flatInvitation)
				.from('flatInvitation')
				.where({ emailAddress: emailAddress.toLowerCase() })
				.orderBy('createAt', 'desc');

			const invitations = results.map(this.mapInvitationsDataToModel);

			const invitationsFullInfo = await Promise.all(
				invitations.map(async (invitation) => {
					const sender = await UserData.getById(invitation.createBy);
					const invitedPerson = await UserData.getByEmailAddress(
						invitation.emailAddress
					);
					const flat = await FlatData.getById(invitation.flatId);
					const flatOwner = await UserData.getById(flat!.createBy!);
					const actionPerson = invitation.actionBy
						? await UserData.getById(invitation.actionBy)
						: null;

					return new FlatInvitationPresentationModel({
						id: invitation.id!,
						token: invitation.token,
						status: invitation.status,
						sendDate: invitation.sendDate,
						actionDate: invitation.actionDate!,
						createAt: invitation.createAt,
						sender: sender!,
						invitedPerson: invitedPerson
							? invitedPerson
							: invitation.emailAddress,
						flat: flat!,
						flatOwner: flatOwner!,
						actionBy: actionPerson,
					});
				})
			);

			logger.debug(
				'[FlatInvitationData].getByUserEmail email: %s, invitations count: %s',
				emailAddress,
				invitationsFullInfo.length
			);
			return invitationsFullInfo;
		} catch (err) {
			logger.debug('[FlatInvitationData].getByUserId error: %o', err);
			throw err;
		}
	}

	static async create(
		flatId: number,
		emailAddresses: string[],
		loggedUserId: number
	) {
		const currentDate = new Date();
		const data: FlatInvitationRow[] = emailAddresses.map((email) => ({
			emailAddress: email.toLowerCase(),
			flatId: flatId,
			status: FlatInvitationStatus.CREATED,
			createBy: loggedUserId,
			createAt: currentDate,
			token: uuidv4(),
			actionBy: loggedUserId,
			actionDate: currentDate,
			sendDate: null,
		}));

		try {
			const createdInvitations = await knex.transaction(async (trx) => {
				const results: FlatInvitationRow[] | {} = await trx(
					'flatInvitation'
				)
					.insert(data)
					.returning<FlatInvitationRow[]>(
						db.CommonCols.flatInvitation
					);

				const createdInvitations: FlatInvitationModel[] = [];
				if (Array.isArray(results)) {
					results.forEach((x) => {
						createdInvitations.push(
							this.mapInvitationsDataToModel(x)
						);
					});
				}
				return createdInvitations;
			});
			logger.debug(
				'[FlatInvitationData].create - number of new invitations for flat: %s is: %s',
				createdInvitations.length
			);
			return createdInvitations;
		} catch (err) {
			logger.debug('[FlatInvitationData].create error: %o', err);
			throw err;
		}
	}

	static async update(
		id: number,
		status: FlatInvitationStatus,
		loggedUserId: number
	) {
		const currentDate = new Date();

		let actionDate: Date | undefined;
		let sendDate: Date | undefined;

		if (
			status === FlatInvitationStatus.ACCEPTED ||
			status === FlatInvitationStatus.REJECTED ||
			status === FlatInvitationStatus.CANCELED
		) {
			actionDate = currentDate;
		}

		if (status === FlatInvitationStatus.PENDING) {
			sendDate = currentDate;
		}

		const data: Partial<FlatInvitationRow> = {
			id: id,
			status: status,
			actionDate,
			actionBy: loggedUserId,
			sendDate,
		};

		try {
			const results = await knex('flatInvitation')
				.update(data)
				.where({ id: id })
				.returning(db.CommonCols.flatInvitation);

			const invitation = this.mapInvitationsDataToModel(results[0]);
			logger.debug(
				'[FlatInvitationData].update invitation: %o',
				invitation
			);

			return invitation;
		} catch (err) {
			logger.debug('[FlatInvitationData].update error: %o', err);
			throw err;
		}
	}

	private static mapInvitationsDataToModel(row: FlatInvitationRow) {
		return new FlatInvitationModel({
			id: row.id,
			emailAddress: row.emailAddress,
			flatId: row.flatId,
			createAt: row.createAt,
			createBy: row.createBy,
			sendDate: row.sendDate,
			actionDate: row.actionDate,
			status: row.status,
			token: row.token,
			actionBy: row.actionBy,
		});
	}
}

export default FlatInvitationData;
