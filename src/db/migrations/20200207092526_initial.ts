import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
    return Promise.all([
        knex.schema.createTable('users', table => {
            table.increments('id').primary();
            table
                .string('emailAddress', 258)
                .unique()
                .notNullable();
            table.string('password', 256).nullable();
            table.string('userName', 50).notNullable();
            table
                .dateTime('joinDate', { precision: 6, useTz: true })
                .defaultTo(knex.fn.now())
                .notNullable();
            table
                .dateTime('lastModDate', { precision: 6, useTz: true })
                .defaultTo(knex.fn.now())
                .notNullable();
            table
                .string('provider', 10)
                .defaultTo('local')
                .notNullable();
            table.string('avatarUrl', 1000);
            table
                .boolean('active')
                .defaultTo(true)
                .notNullable();
        }),
        knex.schema.createTable('sessions', table => {
            table.string('sid').primary();
            table.json('sess').notNullable();
            table.timestamp('expired', { useTz: true });
        }),
        knex.schema.createTable('trc', table => {
            table.string('txt', 4000);
            table.comment('Table for developers tests.');
        }),
        knex.schema.createTable('logs', table => {
            table.increments('id').primary();
            table.string('txt', 4000);
            table
                .dateTime('createAt', { precision: 6, useTz: true })
                .defaultTo(knex.fn.now())
				.notNullable();
			table.string('source', 20)
			table.integer('createBy');
			table.comment('Table for app logs');

			table.foreign('createBy').references('users.id');
        })
    ]).then(() => {
        console.log('Initial migration UP Executed ');
    });
}

export async function down(knex: Knex): Promise<any> {
    return Promise.all([
        knex.schema.dropTable('sessions'),
        knex.schema.dropTable('logs'),
        knex.schema.dropTable('trc'),
        knex.schema.dropTable('users')
    ]).then(() => {
        console.log('Initial migration DOWN Executed ');
    });
}
