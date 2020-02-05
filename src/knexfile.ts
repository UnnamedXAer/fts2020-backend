require('dotenv').config();

export default {
  'development': {
    client: 'pg',
    version: "9.6",
    connection: {
      user: 'postgres',
      host: 'localhost',
      password: process.env.DB_PASSWORD,
      database: 'database_name'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: `migrations`,
      directory: `${__dirname}/db/migrations`
    },
    seeds: {
      directory: './db/seeds/dev'
    },
    useNullAsDefault: true
  },
  'production': {}
};
