import knex from '../../../db';
import UserModel from '../../models/UserModel';
import { UserRow } from '../../CustomTypes/DbTypes';
import { UserExternalRegisterModel } from '../../models/UserAuthModels';
import { UserRegisterModel } from '../../models/UserAuthModels';
import logger from '../../../logger';
import { db } from '../../../constants/dbFields';

class UserData {
	static async getAll() {
		try {
			const results: UserRow[] = await knex('appUser').select(db.CommonCols.user);
			const users = results.map((row) => {
				const user = this.mapRowToModel(row);
				return user;
			});
			logger.debug('[UserData].getAll results count: %s', results.length);
			return users;
		} catch (err) {
			logger.debug('[UserData].getAll error: %o', err);
			throw err;
		}
	}

	static async getByEmailAddressAuth(emailAddress: string) {
		try {
			const results: UserRow[] = await knex('appUser')
				.select(db.CommonCols.user.concat('password'))
				.where(
					knex.raw('LOWER("emailAddress") = :emailAddress', {
						emailAddress: emailAddress.toLowerCase(),
					})
				);
			const row = results[0];
			if (!row) {
				return null;
			}
			const user = new UserModel(
				row.id!,
				row.emailAddress,
				row.userName,
				row.password,
				row.provider,
				row.joinDate,
				row.avatarUrl,
				row.active
			);

			logger.debug(
				'[UserData].getByEmailAddressAuth (%s) results count: %s',
				emailAddress,
				results.length
			);
			return user;
		} catch (err) {
			logger.debug('[UserData].getByEmailAddressAuth error: %o', err);
			throw err;
		}
	}

	static async getByEmailAddress(emailAddress: string) {
		try {
			const results: UserRow[] = await knex('appUser')
				.select(db.CommonCols.user)
				.where(
					knex.raw('LOWER("emailAddress") = :emailAddress', {
						emailAddress: emailAddress.toLowerCase(),
					})
				);
			const row = results[0];
			if (!row) {
				return null;
			}
			const user = this.mapRowToModel(row);

			logger.debug(
				'[UserData].getByEmailAddress (%s) results count: %s',
				emailAddress,
				results.length
			);
			return user;
		} catch (err) {
			logger.debug('[UserData].getByEmailAddress error: %o', err);
			throw err;
		}
	}

	static async getById(id: number) {
		try {
			const results: UserRow[] = await knex('appUser')
				.select(db.CommonCols.user)
				.where({ id });
			const row = results[0];
			if (!row) {
				return null;
			}
			const user = this.mapRowToModel(row);
			logger.debug('[UserData].getById (%s) results count: %s', id, results.length);
			return user;
		} catch (err) {
			logger.debug('[USERData].update error: %o', err);
			throw err;
		}
	}

	static async create(user: UserExternalRegisterModel | UserRegisterModel) {
		let newUser: UserRow;
		if (user instanceof UserRegisterModel) {
			newUser = {
				emailAddress: user.emailAddress,
				userName: user.userName,
				password: user.password,
				provider: user.provider,
				avatarUrl: user.avatarUrl,
				joinDate: new Date(),
				active: true,
			};
		} else {
			newUser = {
				emailAddress: user.emailAddress,
				userName: user.userName,
				provider: user.provider,
				joinDate: new Date(),
				avatarUrl: user.avatarUrl,
				active: true,
			};
		}

		try {
			const results: UserRow[] = await knex('appUser')
				.insert(newUser)
				.returning(db.CommonCols.user);

			const createdUser = this.mapRowToModel(results[0]);
			logger.debug('[UserData].create created user: %o', createdUser);
			return createdUser;
		} catch (err) {
			logger.debug('[UserData].create error: %o', err);
			throw err;
		}
	}

	static async update(user: Partial<UserModel>) {
		try {
			const results: UserRow[] = await knex('appUser')
				.where({ id: user.id })
				.update({
					emailAddress: user.emailAddress,
					userName: user.userName,
					avatarUrl: user.avatarUrl,
					password: user.password,
				} as UserRow)
				.returning(db.CommonCols.user);

			const row = results[0];
			const updatedUser = this.mapRowToModel(row);

			logger.debug('[UserData].update updatedUser: %o', updatedUser);

			return updatedUser;
		} catch (err) {
			logger.debug('[UserData].update error: %o', err);
			throw err;
		}
	}

	private static mapRowToModel(userRow: UserRow) {
		return new UserModel(
			userRow.id!,
			userRow.emailAddress,
			userRow.userName,
			userRow.password,
			userRow.provider,
			userRow.joinDate,
			userRow.avatarUrl,
			userRow.active
		);
	}
}

export default UserData;
