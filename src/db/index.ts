import knex from 'knex';
const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV != 'development' && NODE_ENV != 'development') {
    throw new Error(
        'Invalid Environment Setup: "NODE_ENV" is not set correctly.'
    );
}

const env = NODE_ENV;
console.log(
    `Will connect to postgres`
);

import knexConfigurations from './knexfile';
const database = knex(knexConfigurations[env]);

database
    .raw('select 1')
    .then(() => {
        console.log(`Connected to database - OK`);
    })
    .catch(err => {
        console.error(`Failed to connect to database: ${err}`);
        process.exit(1);
    });


export default database;