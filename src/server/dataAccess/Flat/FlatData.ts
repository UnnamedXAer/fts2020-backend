import FlatModel from '../../Models/FlatModel';
import knex from '../../../db';
import logger from '../../../logger';
import {
	FlatRow,
	FlatMemberRow
} from '../../CustomTypes/DbTypes';

class FlatData {
	static async getAll() {
		try {
			const results: FlatRow[] = await knex('flat').select('*');
			const flats = [];
			for (let i = 0; i < results.length; i++) {
				const flat = results[i];
				const membersResults: { userId: number }[] = await knex(
					'flatMembers'
				)
					.select('userId')
					.where({ flatId: flat.id });

				flats.push(
					new FlatModel({
						id: flat.id,
						name: flat.name,
						address: flat.address,
						createBy: flat.createBy,
						createAt: flat.createAt,
						members: membersResults.map(x => x.userId)
					})
				);
			}
			logger.debug('[FlatData].getAll flatCnt: %s', flats.length);
			return flats;
		} catch (err) {
			logger.debug('[FlatData].getAll error: %o', err);
			throw err;
		}
	}

	static async getByCreatedBy(userId: number) {
		try {
			throw new Error('not implemented yet');
			const results: FlatRow[] = await knex('flat')
				.select('*')
				.where({ createBy: userId });
			const flats = results.map(async flat => {
				const membersResults: number[] = await this.getMembers(flat.id);

				return new FlatModel({
					id: flat.id,
					name: flat.name,
					address: flat.address,
					createBy: flat.createBy,
					createAt: flat.createAt,
					members: membersResults
				});
			});

			logger.debug('[FlatData].getByCreatedBy flatCnt: %s', flats.length);
			return flats;
		} catch (err) {
			logger.debug('[FlatData].getByCreatedBy error: %o', err);
			throw err;
		}
	}

	static async verifyIfMember(userId: number, name: string) {
		try {
			const results = await knex('flat')
				.join('flatMembers', 'flat.id', 'flatMembers.flatId')
				.whereRaw('LOWER(name) like ?', name.toLowerCase())
				.andWhere({ userId }).count(1);


			// const results = await knex('flatMembers').raw()

			const exists = results.length > 0;
			logger.debug('[FlatData].verifyIfExist exists: %s', exists);
			return exists;
		} catch (err) {
			logger.debug('[FlatData].verifyIfExist error: %o', err);
			throw err;
		}
	}

	static async create(
		flat: FlatModel,
		loggedUserId: number
	): Promise<FlatModel> {
		const currentDate = new Date();
		// let createdFlat: FlatModel;

		const flatData = {
			name: flat.name,
			address: flat.address,
			createAt: currentDate,
			createBy: loggedUserId,
			lastModAt: currentDate,
			lastModBy: loggedUserId
		} as FlatRow;

		try {
			let createdFlat = await knex.transaction(async trx => {
				const results: FlatRow[] = await trx('flat')
					.insert(flatData)
					.returning('*');

				const flatRow = results[0];
				const createdFlat = new FlatModel({
					id: flatRow.id,
					name: flat.name,
					address: flat.address,
					createAt: flat.createAt,
					createBy: flat.createBy
				});

				const memberData: FlatMemberRow = {
					flatId: createdFlat.id!,
					addedBy: loggedUserId,
					userId: loggedUserId,
					addedAt: currentDate
				};
				const addedMembers = await trx('flatMembers')
					.insert(memberData)
					.returning('id');
				createdFlat.members = addedMembers;

				logger.debug('[FlatData].create flat: %o', createdFlat);
				return createdFlat;
			});

			return createdFlat;
		} catch (err) {
			logger.debug('[FlatData].create error: %o', err);
			throw err;
		}
	}

	static async addMembers(flatId: number, members: number[]) {
		try {
			const existingMembers = await this.getMembers(flatId);

			const notIncludedMembers = members.filter(
				x => !existingMembers.includes(x)
			);

			const membersData = notIncludedMembers.map(x => ({
				userId: x,
				flatId
			}));

			const results: number[] = await knex('flatMembers')
				.insert(membersData)
				.returning('id');

			logger.debug(
				'[FlatData].addMembers added members for: %s are: %o',
				flatId,
				results
			);

			return results;
		} catch (err) {
			logger.debug('[FlatData].addMembers error: %o', err);
			throw err;
		}
	}

	static async getMembers(flatId: number) {
		try {
			const existingMembers: number[] = await knex('flatMembers')
				.select('userId')
				.where({ flatId });

			logger.debug(
				'[FlatData].getMembers existing members for: %s are: %o',
				flatId,
				existingMembers
			);
			return existingMembers;
		} catch (err) {
			logger.debug('[FlatData].getMembers error: %o', err);
			throw err;
		}
	}
}

export default FlatData;
