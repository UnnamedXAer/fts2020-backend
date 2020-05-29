import FlatModel from '../../models/FlatModel';
import knex from '../../../db';
import logger from '../../../logger';
import {
	FlatRow,
	FlatMembersRow,
	MembersForFlatRow,
} from '../../customTypes/DbTypes';
import UserModel from '../../models/UserModel';

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
					description: flatRow.description,
					createBy: flatRow.createBy,
					createAt: flatRow.createAt,
					members: membersResults.map((x) => x.userId),
				});
				logger.debug('[FlatData].getById flat id: %s, flat exists', id);

				return flat;
			} else {
				logger.debug(
					'[FlatData].getById flat id %s, do NOT exists',
					id
				);
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

				const membersResults: MembersForFlatRow[] = await knex(
					'flatMembers'
				)
					.select('userId')
					.where({ flatId: flat.id });

				flats.push(
					new FlatModel({
						id: flat.id,
						name: flat.name,
						description: flat.description,
						createBy: flat.createBy,
						createAt: flat.createAt,
						members: membersResults.map((x) => x.userId),
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
			const flats = results.map(async (flat) => {
				const membersResults: number[] = await (
					await this.getMembers(flat.id)
				).map((x) => x.id);

				return new FlatModel({
					id: flat.id,
					name: flat.name,
					description: flat.description,
					createBy: flat.createBy,
					createAt: flat.createAt,
					members: membersResults,
				});
			});

			logger.debug(
				'[FlatData].getByCreatedBy userID: %s flatCnt: %s',
				userId,
				flats.length
			);
			return flats;
		} catch (err) {
			logger.debug('[FlatData].getByCreatedBy error: %o', err);
			throw err;
		}
	}

	static async getByMember(userId: number) {
		try {
			const results: FlatRow[] = await knex('flat')
				.select('flat.*')
				.join('flatMembers', 'flat.id', '=', 'flatMembers.flatId')
				.where({ userId });
			const flatsPromises = results.map(async (flat) => {
				const membersResults: number[] = await (
					await this.getMembers(flat.id)
				).map((x) => x.id);

				return new FlatModel({
					id: flat.id,
					name: flat.name,
					description: flat.description,
					createBy: flat.createBy,
					createAt: flat.createAt,
					members: membersResults,
				});
			});

			const flats = await Promise.all(flatsPromises);

			logger.debug(
				'[FlatData].getByMember member id: %s flatCnt: %s',
				userId,
				flats.length
			);
			return flats;
		} catch (err) {
			logger.debug('[FlatData].getByMember error: %o', err);
			throw err;
		}
	}

	static async create(
		flat: FlatModel,
		loggedUser: UserModel
	): Promise<FlatModel> {
		const currentDate = new Date();

		const flatData = {
			name: flat.name,
			description: flat.description,
			createAt: currentDate,
			createBy: loggedUser.id!,
			lastModAt: currentDate,
			lastModBy: loggedUser.id!,
		} as FlatRow;

		try {
			let createdFlat = await knex.transaction(async (trx) => {
				const results: FlatRow[] = await trx('flat')
					.insert(flatData)
					.returning('*');

				const flatRow = results[0];
				const createdFlat = new FlatModel({
					id: flatRow.id,
					name: flatRow.name,
					description: flatRow.description,
					createAt: flatRow.createAt,
					createBy: flatRow.createBy,
				});

				const resultsMembers: number[] = await trx
					.table('flatMembers')
					.insert({
						addedAt: currentDate,
						addedBy: loggedUser.id,
						flatId: createdFlat.id,
						userId: loggedUser.id,
					} as FlatMembersRow)
					.returning('id');

				createdFlat.members = [...resultsMembers];

				return createdFlat;
			});

			logger.debug('[FlatData].create flat: %o', createdFlat);
			return createdFlat;
		} catch (err) {
			logger.debug('[FlatData].create error: %o', err);
			throw err;
		}
	}

	static async delete(id: number, userId: number) {
		try {
			let results = await knex.transaction(async (trx) => {
				await trx('flatMembers').delete().where({ flatId: id });

				const deleteFlatResults = await trx('flat')
					.delete()
					.where({ id });

				logger.debug(
					'[FlatData].delete flat Id: %s, by %s, deleted count %s',
					id,
					userId,
					deleteFlatResults
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
			const results: UserModel[] = await knex('flatMembers')
				.join('appUser', 'appUser.id', '=', 'userId')
				.select('appUser.*')
				.where({ flatId });

			const existingMembers = results.map(
				(x) =>
					new UserModel(
						x.id,
						x.emailAddress,
						x.userName,
						void 0,
						x.provider,
						x.joinDate,
						x.avatarUrl,
						x.active
					)
			);
			logger.debug(
				'[FlatData].getMembers flat Id: %s, members count: %s',
				flatId,
				existingMembers.length
			);
			return existingMembers;
		} catch (err) {
			logger.debug('[FlatData].getMembers error: %o', err);
			throw err;
		}
	}

	static async addMember(
		flatId: number,
		userId: number,
		signedInUserId: number
	) {
		try {
			const existingMembers = (await this.getMembers(flatId)).map(
				(x) => x.id
			);

			if (existingMembers.includes(userId)) {
				throw new Error(
					`User (${userId}) is already a member of the flat (${flatId}).`
				);
			}
			const insertDate = new Date();
			const membersData = <FlatMembersRow>{
				userId,
				flatId,
				addedAt: insertDate,
				addedBy: signedInUserId,
			};

			const results: number[] = await knex('flatMembers')
				.insert(membersData)
				.returning('userId');

			let addedMemberId: number = results[0];
			logger.debug(
				'[FlatData].addMember added member id: %s',
				addedMemberId
			);

			return addedMemberId;
		} catch (err) {
			logger.debug('[FlatData].addMember error: %o', err);
			throw err;
		}
	}

	static async deleteMembers(
		flatId: number,
		members: number[],
		signedInUserId: number
	) {
		try {
			const membersToDelete: [number, number][] = [];
			members.forEach((x) => {
				if (x != signedInUserId) {
					membersToDelete.push([x, flatId]);
				}
			});

			const deletedRowsCnt = await knex('flatMembers')
				.delete()
				.whereIn(['userId', 'flatId'], membersToDelete);

			logger.debug(
				'[FlatData].deleteMembers members: %s, flat Id: s%, delete count: %o',
				members,
				flatId,
				deletedRowsCnt
			);

			return deletedRowsCnt;
		} catch (err) {
			logger.debug('[FlatData].deleteMembers error: %o', err);
			throw err;
		}
	}

	static async isUserFlatOwner(userId: number, flatId: number) {
		try {
			const flat = await this.getById(flatId);
			const isOwner = !!flat && flat.createBy == userId;
			logger.debug(
				'[FlatData].isFlatOwner flat %s, user: %s, isOwner: %s',
				flatId,
				userId,
				isOwner
			);
			return isOwner;
		} catch (err) {
			logger.debug('[FlatData].isFlatOwner error: %o', err);
			throw err;
		}
	}

	static async isUserFlatMember(userId: number, flatId: number) {
		let isMembers = false;

		try {
			let results;

			results = await knex('flatMembers')
				.andWhere({ userId, flatId: flatId })
				.count('flatId');

			if (results[0] && results[0].count) {
				const { count } = results[0];
				if (typeof count == 'number') {
					isMembers = count > 0;
				} else {
					isMembers = parseInt(count) > 0;
				}
			}

			logger.debug(
				'[FlatData].isUserFlatMember userId: %s, flatId: %s, flats count: %s ',
				userId,
				flatId,
				results[0]?.count ? results[0]?.count : 0
			);
			return isMembers;
		} catch (err) {
			logger.debug('[FlatData].isUserFlatMember error: %o', err);
			throw err;
		}
	}

	static async verifyIfMember(userId: number, name: string, flatId?: number) {
		let exists = false;

		try {
			let results;

			if (flatId) {
				results = await knex('flatMembers')
					.andWhere({ userId, flatId: flatId })
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
				'[FlatData].verifyIfMember flat with name: %s, for user: %s - exists: %s',
				name,
				userId,
				exists
			);
			return exists;
		} catch (err) {
			logger.debug('[FlatData].verifyIfMember error: %o', err);
			throw err;
		}
	}
}

export default FlatData;
