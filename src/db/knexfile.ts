require('dotenv').config();

export default {
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
            directory: `./migrations`
        },
        seeds: {
            directory: `./seeds/dev`
        },
        useNullAsDefault: true
    },
    production: {
		
	}
};
