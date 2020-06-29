import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
	return knex.schema
		.table('flat', (table) => {
			table.boolean('active').defaultTo(true).notNullable();
		})
		.then(() => {
			console.log('"Flat - add active" migration UP Executed ');
		});
}

export async function down(knex: Knex): Promise<any> {
	return knex.schema
		.table('flat', (table) => table.dropColumn('active'))
		.then(() => {
			console.log('"Flat - add active" migration DOWN Executed ');
		});
}
