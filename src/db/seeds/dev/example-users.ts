import Knex from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<any> {
    const hashPassword = await bcrypt.hash(
        'Pwd12345',
        await bcrypt.genSalt(10)
    );

    const avatarUrl =
        'https://store-images.s-microsoft.com/image/apps.46874.37ea8e43-6d69-48a4-a8da-47580dfe55b5.cf90a1b2-49f6-4c7d-9984-f3d287b579c2.4adf6cdc-92cc-4260-bdb3-cca09c2ea124.png';

    // Deletes ALL existing entries
    return Promise.all<{
		command: string;
		rowCount: number;
	}>([
		knex('appUser')
			.del()
			.then(() => {
				// Inserts seed entries
				return knex('appUser').insert([
					{
						emailAddress: 'test@test.com',
						userName: 'Long John Silver',
						provider: 'local',
						password: hashPassword,
						avatarUrl,
						active: true
					},
					{
						emailAddress: 'rkl2@o2.pl',
						userName: 'Kamil',
						provider: 'local',
						password: hashPassword,
						avatarUrl,
						active: true
					},
					{
						emailAddress: 'no@test.com',
						userName: 'Ann',
						provider: 'local',
						password: hashPassword,
						avatarUrl,
						active: false
					},
					{
						emailAddress: 'dean@test.com',
						userName: 'Dean W',
						provider: 'local',
						password: hashPassword,
						avatarUrl,
						active: true
					}
				]);
			}),
		knex('logs').insert({
			txt: 'Run seed: example-users',
			source: 'seed/dev/'
		})
	])
		.then(res => {
			console.log('Done seeding: example-users.');
			res.forEach(x =>
				console.log(`command: ${x.command}, rowCount: ${x.rowCount}`)
			);
		})
		.catch(err =>
			console.error(
				'Error in seeding: example-users\n',
				err && err.detail ? err.detail : err
			)
		);
}
