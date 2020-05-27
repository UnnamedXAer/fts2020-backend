import FlatInvitationModel from '../../models/FlatInvitation';
import knex from '../../../db';
import logger from '../../../logger';
import { FlatInvitationRow, db } from '../../customTypes/DbTypes';
import { FlatInvitationStatus } from '../../customTypes/DbTypes';

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

	static async getByUserId(id: number) {
		try {
			const results: FlatInvitationRow[] = await knex
				.select(db.CommonCols.flatInvitation)
				.from('task')
				.join('appUser', { 'appUser.id': 'flatInvitation.id' })
				.where({ 'appUser.id': id });

			const invitations = results.map(this.mapInvitationsDataToModel);

			logger.debug(
				'[FlatInvitationData].getByUserId FlatId: %s, invitations count: %s',
				id,
				invitations.length
			);
			return invitations;
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
			emailAddress: email,
			flatId: flatId,
			status: FlatInvitationStatus.NOT_SENT,
			createBy: loggedUserId,
			createAt: currentDate,
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

	static async update(id: number, status: FlatInvitationStatus) {
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
		});
	}
}

export default FlatInvitationData;
