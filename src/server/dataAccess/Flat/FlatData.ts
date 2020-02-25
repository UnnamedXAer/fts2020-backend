import FlatModel from '../../Models/FlatModel';
import knex from '../../../db';
import logger from '../../../logger';
import { FlatRow, FlatMemberRow } from '../../CustomTypes/DbTypes';

class FlatData {
	static async getById(id: number) {
		try {
			const results: FlatRow[] = await knex('flat').where({ id });
			const flatRow = results[0];

			if (flatRow) {
				const membersResults: { userId: number }[] = await knex(
					'flatMembers'
				)
					.select('userId')
					.where({ flatId: flatRow.id });

				const flat = new FlatModel({
					id: flatRow.id,
					name: flatRow.name,
					address: flatRow.address,
					createBy: flatRow.createBy,
					createAt: flatRow.createAt,
					members: membersResults.map(x => x.userId)
				});
				logger.debug('[FlatData].getById flat (%s): %o', id, flat);

				return flat;
			} else {
				logger.debug('[FlatData].getById flat (%s): do not exists', id);
				return null;
			}
		} catch (err) {
			logger.debug('[FlatData].getById error: %o', err);
			throw err;
		}
	}

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

	static async create(
		flat: FlatModel,
		loggedUserId: number
	): Promise<FlatModel> {
		const currentDate = new Date();

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
					.returning('userId');
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

	static async delete(id: number, userId: number) {
		try {
			let results = await knex.transaction(async trx => {
				await trx('flatMembers')
					.delete()
					.where({ flatId: id });

				const deleteFlatResults = await trx('flat')
					.delete()
					.where({ id });

				logger.debug(
					'[FlatData].delete flat deleted: %s, by: %s',
					id,
					userId
				);
				return deleteFlatResults > 0;
			});

			return results;
		} catch (err) {
			logger.debug('[FlatData].delete error: %o', err);
			throw err;
		}
	}

	static async getMembers(flatId: number) {
		try {
			const results: { userId: number }[] = await knex('flatMembers')
				.select('userId')
				.where({ flatId });

			const existingMembers = results.map(x => x.userId);
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

	static async addMembers(
		flatId: number,
		members: number[],
		signedInUserId: number
	) {
		try {
			const existingMembers = await this.getMembers(flatId);

			const notIncludedMembers = members.filter(
				x => !existingMembers.includes(x)
			);
			const insertDate = new Date();
			const membersData = notIncludedMembers.map(
				x =>
					<FlatMemberRow>{
						userId: x,
						flatId,
						addedAt: insertDate,
						addedBy: signedInUserId
					}
			);

			const results: number[] | { rows: number[] } = await knex(
				'flatMembers'
			)
				.insert(membersData)
				.returning('userId');

			let addedMembers: number[];
			if (Array.isArray(results)) {
				addedMembers = results;
			} else {
				addedMembers = results.rows ? results.rows : [];
			}
			logger.debug(
				'[FlatData].addMembers added members for: %s are: %o',
				flatId,
				addedMembers
			);

			return addedMembers;
		} catch (err) {
			logger.debug('[FlatData].addMembers error: %o', err);
			throw err;
		}
	}

	static async deleteMembers(
		flatId: number,
		members: number[],
		signedInUserId: number
	) {
		try {
			const membersToDelete: [number, number ][] = [];
			members.forEach(x => {
				if (x != signedInUserId) {
					membersToDelete.push([x, flatId ]);
				}
			});

			const deletedRowsCnt = await knex('flatMembers')
				.delete()
				.whereIn(['userId', 'flatId'], membersToDelete);

			logger.debug(
				'[FlatData].deleteMembers deleted members count for: %s is: %o',
				flatId,
				deletedRowsCnt
			);

			return deletedRowsCnt;
		} catch (err) {
			logger.debug('[FlatData].deleteMembers error: %o', err);
			throw err;
		}
	}

	static async isUserFlatOwner(userId: number, id: number) {
		try {
			const flat = await this.getById(id);
			const isOwner = !!flat && flat.createBy == userId;
			logger.debug(
				'[FlatData].isFlatOwner flat %s, user: %s, isOwner: %s',
				id,
				userId,
				isOwner
			);
			return isOwner;
		} catch (err) {
			logger.debug('[FlatData].isFlatOwner error: %o', err);
			throw err;
		}
	}

	static async verifyIfMember(userId: number, name: string, id?: number) {
		let exists = false;

		try {
			let results;

			if (id) {
				results = await knex('flatMembers')
					.andWhere({ userId, flatId: id })
					.count('id');
			} else {
				results = await knex('flat')
					.join('flatMembers', 'flat.id', 'flatMembers.flatId')
					.whereRaw('LOWER(name) like ?', name.toLowerCase())
					.andWhere({ userId })
					.count('flat.id');
			}

			if (results[0] && results[0].count) {
				const { count } = results[0];
				if (typeof count == 'number') {
					exists = count > 0;
				} else {
					exists = parseInt(count) > 0;
				}
			}

			logger.debug(
				'[FlatData].verifyIfExist flat with name: %s, for user: %s - exists: %s',
				name,
				userId,
				exists
			);
			return exists;
		} catch (err) {
			logger.debug('[FlatData].verifyIfExist error: %o', err);
			throw err;
		}
	}
}

export default FlatData;
