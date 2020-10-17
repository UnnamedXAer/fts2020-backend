import * as Knex from 'knex';
import usersFeed from '../feed/prod/usersFeed';

const fileName = __filename.split(/[\\/]/).pop();

export async function seed(knex: Knex): Promise<any> {
	return Promise.all<{
		command: string;
		rowCount: number;
	}>([
		knex('appUser').insert(usersFeed),
		knex('logs').insert({
			txt: 'Executed seed: fileName, inserted ' + usersFeed.length + ' row(s)',
			source: fileName,
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
