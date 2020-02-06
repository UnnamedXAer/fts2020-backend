import knex from '../../../db';
import UserModel from '../../models/UserModel';
import { UserRow } from '../../CustomTypes/Types';
import { UserExternalRegisterModel } from '../../models/UserAuthModels';
import { UserRegisterModel } from '../../models/UserAuthModels';

class UserData {
    static async getAll() {
        try {
            const results: UserRow[] = await knex('users').select('*');
            const users = results.map(row => {
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

    static async getByEmailAddress(emailAddress: string) {
        try {
            const results: UserRow[] = await knex('users')
                .select('*')
                .where(
                    knex.raw('LOWER("emailAddress") = :emailAddress', {
                        emailAddress: emailAddress.toLowerCase()
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

    static async getById(id: number) {
        try {
            const results: UserRow[] = await knex('users')
                .select('*')
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
				active: true
            };
        } else {
            newUser = {
                emailAddress: user.emailAddress,
                userName: user.userName,
                provider: user.provider,
                joinDate: new Date(),
				avatarUrl: user.avatarUrl,
				active: true
            };
        }
        try {
            const results: number[] = await knex('users')
                .insert(newUser)
                .returning('id');

            return results[0];
        } catch (err) {
            throw err;
        }
    }

    static async update(user: UserModel) {
        try {
            const results: number[] = await knex('users')
                .where({ id: user.id })
                .update({
                    emailAddress: user.emailAddress,
                    userName: user.userName,
                    avatarUrl: user.avatarUrl
                } as UserRow)
                .returning('id');

            return results[0];
        } catch (err) {
            throw err;
        }
    }
}

export default UserData;
