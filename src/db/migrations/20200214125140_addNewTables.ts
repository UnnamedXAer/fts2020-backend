import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
	return Promise.all([
		knex.schema.createTable('flat', table => {
			table.increments('id').primary();
			table.string('name', 100).notNullable();
			table.string('address', 500).nullable();
			table.integer('createBy').notNullable();
			table
				.dateTime('createAt', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();
			table.integer('lastModBy').notNullable();
			table
				.dateTime('lastModAt', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();

			table.foreign('createAt').references('users.id');
			table.foreign('lastModAt').references('users.id');
		}),

		knex.schema.createTable('task', table => {
			table.increments('id').primary();
			table.integer('flatId').notNullable();
			table.string('title', 100).notNullable();
			table.string('description', 500).nullable();
			table.dateTime('startDate', { precision: 6, useTz: true });
			table.dateTime('endDate', { precision: 6, useTz: true });
			table.integer('timePeriod').notNullable();
			table
				.boolean('active')
				.notNullable()
				.defaultTo(true);
			table.integer('createBy').notNullable();
			table
				.dateTime('createAt', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();
			table.integer('lastModBy').notNullable();
			table
				.dateTime('lastModAt', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();

			table.foreign('createAt').references('users.id');
			table.foreign('lastModAt').references('users.id');
			table.foreign('flatId').references('flat.id');
		}),

		knex.schema.createTable('taskMembers', table => {
			table.increments('id').primary();
			table.integer('flatId').notNullable();
			table.integer('userId').notNullable();
			table.integer('position').notNullable();
			table
				.dateTime('addedAt', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();
			table.integer('addedBy').notNullable();

			table.foreign('flatId').references('flat.id');
			table.foreign('userId').references('users.id');
			table.foreign('addedBy').references('users.id');
		}),

		knex.schema.createTable('taskPeriods', table => {
			table.increments('id').primary();
			table.integer('taskId').notNullable();
			table
				.dateTime('startDate', { precision: 6, useTz: true })
				.notNullable();
			table
				.dateTime('endDate', { precision: 6, useTz: true })
				.notNullable();
			table.integer('assignedTo').notNullable();
			table.integer('completedBy').nullable();
			table
				.dateTime('completedAt', { precision: 6, useTz: true })
				.nullable();

			table.foreign('taskId').references('task.id');
			table.foreign('assignedTo').references('users.id');
			table.foreign('completedBy').references('users.id');
			
		}),

		knex.schema.createTable('taskPeriodChangeRequest', table => {
			table.increments('id').primary();
			table.integer('taskPeriodId').notNullable();
			table.integer('requestedBy').notNullable();
			table
				.dateTime('requestedAt', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();
			table
				.boolean('accepted')
				.defaultTo(false)
				.notNullable();
			table.integer('respondedBy').nullable();
			table
				.dateTime('respondedAt', { precision: 6, useTz: true })
				.nullable();

			table.foreign('taskPeriodId').references('taskPeriod.id');
			table.foreign('requestedBy').references('users.id');
			table.foreign('respondedBy').references('users.id');
		})
	]);
}

export async function down(knex: Knex): Promise<any> {}
