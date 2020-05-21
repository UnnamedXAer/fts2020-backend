import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
	return Promise.all([
		knex.schema.createTable('flatInvitation', (table) => {
			table.increments('id').primary();
			table.integer('flatId').notNullable();
			table.string('emailAddress', 258).notNullable();
			table.integer('createBy').notNullable();
			table
				.dateTime('createDate', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();
			table
				.dateTime('actionDate', { precision: 6, useTz: true })
				.nullable();
			table
				.enu('status', ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
				.notNullable()
				.defaultTo('PENDING');

			table.foreign('createBy').references('appUser.id');
			table.foreign('flatId').references('flat.id');
		}),
	]).then(() => {
		console.log('"Flat Invitation" migration UP Executed ');
	});
}

export async function down(knex: Knex): Promise<any> {
	return Promise.all([knex.schema.dropTableIfExists('flatInvitation')]).then(
		() => {
			console.log('"Flat Invitation" migration DOWN Executed ');
		}
	);
}
