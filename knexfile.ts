require('dotenv').config();
const path = require('path');
const BASE_PATH = path.join(__dirname, 'src', 'server', 'db');

module.exports = {
    development: {
        client: 'pg',
        version: '9.6',
        connection: {
            user: process.env.DB_USER as string,
            host: process.env.DB_HOST as string,
            password: process.env.DB_PASSWORD as string,
            database: process.env.DB_NAME as string
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: `knex_migrations`,
            directory: path.join(BASE_PATH, 'migrations')
        },
        seeds: {
            directory: path.join(BASE_PATH, 'seeds', 'dev')
        },
        useNullAsDefault: true
    },
    production: {}
};
