const path = require('path');
const BASE_PATH = path.join(__dirname, '../', '../');

require('dotenv').config({ path: BASE_PATH + '.env' });
console.log('knexfile: BASE_PATH: ' + BASE_PATH);

const connection = {
	user: process.env.DB_USER as string,
    host: process.env.DB_HOST as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string
};
console.log('knexfile: database: ' + connection.database);

module.exports = {
    development: {
        client: 'pg',
        version: '9.6',
        connection,
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: `knex_migrations`,
            directory: './migrations'
        },
        seeds: {
            directory: './seeds/dev'
        },
        useNullAsDefault: true
    },
    production: {
        client: 'pg',
        version: '9.6',
        connection,
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: `knex_migrations`,
            directory: './migrations'
        },
        seeds: {
            directory: './seeds/prod'
        },
        useNullAsDefault: true
    }
};
