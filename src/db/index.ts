import Knex from 'knex';
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

const knexConfigurations = require('./knexfile');
const database = Knex(knexConfigurations[env]);

database('logs')
    .insert({
        txt: 'Checking db connection on app server start.',
        source: '/db/index',
        createAt: new Date()
    })
    .then(() => {
        console.log(`Connected to database - OK`);
    })
    .catch(err => {
        console.error(`Failed to connect to database: ${err}`);
        process.exit(1);
    });

export default database;
module.exports = database;