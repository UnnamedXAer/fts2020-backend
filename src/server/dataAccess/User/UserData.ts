import knex from '../../../db';
import UserModel from '../../Models/UserModel';
import { UserRow, db } from '../../CustomTypes/DbTypes';
import { UserExternalRegisterModel } from '../../Models/UserAuthModels';
import { UserRegisterModel } from '../../Models/UserAuthModels';

class UserData {
	static async getAll() {
		try {
			const results: UserRow[] = await knex('appUser').select(
				db.CommonCols.user
			);
			const users = results.map((row) => {
				const user = new UserModel(
					row.id!,
					row.emailAddress,
					row.userName,
					void 0,
					row.provider,
					row.joinDate,
					row.avatarUrl,
					row.active
				);
				return user;
			});

			return users;
		} catch (err) {
			throw err;
		}
	}

	static async getByEmailAddressAuth(emailAddress: string) {
		try {
			const results: UserRow[] = await knex('appUser')
				.select('*')
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

			return user;
		} catch (err) {
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
			const user = new UserModel(
				row.id!,
				row.emailAddress,
				row.userName,
				void 0,
				row.provider,
				row.joinDate,
				row.avatarUrl,
				row.active
			);

			return user;
		} catch (err) {
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
			const user = new UserModel(
				row.id!,
				row.emailAddress,
				row.userName,
				void 0,
				row.provider,
				row.joinDate,
				row.avatarUrl,
				row.active
			);

			return user;
		} catch (err) {
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

			const row = results[0];
			return new UserModel(
				row.id!,
				row.emailAddress,
				row.userName,
				void 0,
				row.provider,
				row.joinDate,
				row.avatarUrl,
				row.active
			);
		} catch (err) {
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
				} as UserRow)
				.returning(db.CommonCols.user);

			const row = results[0];
			const updatedUser = this.mapRowToModel(row);
			return updatedUser;
		} catch (err) {
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
