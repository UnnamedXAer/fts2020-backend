import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
	return knex.schema
		.table('flatInvitation', (table) => {
			table.uuid('token').unique().notNullable();
			table.integer('actionBy');

			table.foreign('actionBy').references('appUser.id');
		})
		.then(() => {
			console.log('"Flat Invitation - add uuid" migration UP Executed ');
		});
}

export async function down(knex: Knex): Promise<any> {
	return knex.schema
		.table('flatInvitation', (table) => table.dropColumn('token'))
		.then(() => {
			console.log(
				'"Flat Invitation - add uuid" migration DOWN Executed '
			);
		});
}
