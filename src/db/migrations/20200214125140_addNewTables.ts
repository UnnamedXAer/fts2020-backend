import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
	return Promise.all([
		knex.schema.createTable('flat', table => {
			table.increments('id').primary();
			table.string('name', 50).notNullable();
			table.string('address', 200).nullable();
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

			table.foreign('createBy').references('appUser.id');
			table.foreign('lastModBy').references('appUser.id');
		}),

		knex.schema.createTable('flatMembers', table => {
			table.increments('id').primary();
			table.integer('flatId').notNullable();
			table.integer('userId').notNullable();
			table.integer('addedBy').notNullable();
			table
				.dateTime('addedAt', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();

			table.foreign('flatId').references('flat.id');
			table.foreign('userId').references('appUser.id');
			table.foreign('addedBy').references('appUser.id');
		}),

		knex.schema.createTable('task', table => {
			table.increments('id').primary();
			table.integer('flatId').notNullable();
			table.string('title', 50).notNullable();
			table.string('description', 500).nullable();
			table.dateTime('startDate', { precision: 6, useTz: true });
			table.dateTime('endDate', { precision: 6, useTz: true });
			table
				.enu('timePeriodUnit', ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'])
				.notNullable();
			table.integer('timePeriodValue', 3).notNullable();
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

			table.foreign('createBy').references('appUser.id');
			table.foreign('lastModBy').references('appUser.id');
			table.foreign('flatId').references('flat.id');

			table.comment('Table contains details of activities that will be repeated by members in given time periods');
		}),

		knex.schema.createTable('taskMembers', table => {
			table.increments('id').primary();
			table.integer('taskId').notNullable();
			table.integer('userId').notNullable();
			table.integer('position').notNullable();
			table
				.dateTime('addedAt', { precision: 6, useTz: true })
				.defaultTo(knex.fn.now())
				.notNullable();
			table.integer('addedBy').notNullable();

			table.foreign('taskId').references('task.id');
			table.foreign('userId').references('appUser.id');
			table.foreign('addedBy').references('appUser.id');

			table.comment('Table contains links between user that participate in specific task and task.')
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
			table.foreign('assignedTo').references('appUser.id');
			table.foreign('completedBy').references('appUser.id');

			table.comment('Table contains scheduled tasks periods with assigned users.');
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

			table.foreign('taskPeriodId').references('taskPeriods.id');
			table.foreign('requestedBy').references('appUser.id');
			table.foreign('respondedBy').references('appUser.id');

			table.comment('Row represents a request for change in task schedule. eg. user want to swap his weekly cleaning with someone.');
		})
	]).then(() => {
		console.log('"addNewTables" migration UP Executed ');
	});
}

export async function down(knex: Knex): Promise<any> {
	return Promise.all([
		knex.schema.dropTableIfExists('taskPeriodChangeRequest'),
		knex.schema.dropTableIfExists('taskPeriods'),
		knex.schema.dropTableIfExists('taskMembers'),
		knex.schema.dropTableIfExists('task'),
		knex.schema.dropTableIfExists('flatMembers'),
		knex.schema.dropTableIfExists('flat')
	]).then(() => {
		console.log('"addNewTables" migration DOWN Executed ');
	});
}
