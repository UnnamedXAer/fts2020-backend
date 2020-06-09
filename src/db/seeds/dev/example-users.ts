import Knex from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<any> {
	const hashPassword = await bcrypt.hash('qwe123', await bcrypt.genSalt(10));

	return Promise.all<{
		command: string;
		rowCount: number;
	}>([
		knex('appUser')
		.del()  // Deletes ALL existing entries !!!
			.then(() => {
				// Inserts seed entries
				return knex('appUser').insert([
					{
						emailAddress: 'test@test.com',
						userName: 'Long John Silver',
						provider: 'local',
						password: hashPassword,
						avatarUrl:
							'http://pngimg.com/uploads/pokemon/pokemon_PNG161.png',
						active: true,
					},
					{
						emailAddress: 'rkl2@o2.pl',
						userName: 'Kamil',
						provider: 'local',
						password: hashPassword,
						avatarUrl:
							'http://pngimg.com/uploads/pokemon/pokemon_PNG160.png',
						active: true,
					},
					{
						emailAddress: 'no@test.com',
						userName: 'Ann',
						provider: 'local',
						password: hashPassword,
						avatarUrl:
							'http://pngimg.com/uploads/pokemon/pokemon_PNG153.png',
						active: false,
					},
					{
						emailAddress: 'dean@test.com',
						userName: 'Dean W',
						provider: 'local',
						password: hashPassword,
						avatarUrl:
							'http://pngimg.com/uploads/pokemon/pokemon_PNG149.png',
						active: true,
					},
					{
						emailAddress: 'unnamedxaer@hotmail.com',
						userName: 'UnnamedXAer',
						provider: 'local',
						password: hashPassword,
						avatarUrl:
							'http://pngimg.com/uploads/pokemon/pokemon_PNG34.png',
						active: true,
					},
				]);
			}),
		knex('logs').insert({
			txt: 'Run seed: example-users',
			source: 'seed/dev/',
		}),
	])
		.then((res) => {
			console.log('Done seeding: example-users.');
			res.forEach((x) =>
				console.log(`command: ${x.command}, rowCount: ${x.rowCount}`)
			);
		})
		.catch((err) =>
			console.error(
				'Error in seeding: example-users\n',
				err && err.detail ? err.detail : err
			)
		);
}
