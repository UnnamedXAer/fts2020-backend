const path = require('path');
const BASE_PATH = path.join(__dirname, '../', '../');
const Logger = require('../logger');

require('dotenv').config({ path: BASE_PATH + '.env' });
Logger.info('knexfile: BASE_PATH: ' + BASE_PATH);
Logger.info(('knexfile: DATABASE: ' + process.env.DB_NAME) as string);

const connection = process.env.DB_NAME
	? {
			user: process.env.DB_USER as string,
			host: process.env.DB_HOST as string,
			password: process.env.DB_PASSWORD as string,
			database: process.env.DB_NAME as string,
			ssl:
				process.env.DB_USE_SSL === 'TRUE'
					? { rejectUnauthorized: false }
					: void 0,
	  }
	: (process.env.DATABASE_URL as string);

module.exports = {
	development: {
		client: 'pg',
		version: '9.6',
		connection,
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: `knex_migrations`,
			directory: './migrations',
		},
		seeds: {
			directory: './seeds/dev',
		},
		useNullAsDefault: true,
	},
	production: {
		client: 'pg',
		version: '9.6',
		connection,
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: `knex_migrations`,
			directory: './migrations',
		},
		seeds: {
			directory: './seeds/prod',
		},
		useNullAsDefault: true,
	},
};
