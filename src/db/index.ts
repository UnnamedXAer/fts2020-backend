import Knex from 'knex';
import logger from '../logger';
const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV != 'development' && NODE_ENV != 'production') {
    throw new Error(
        'Invalid Environment Setup: "NODE_ENV" is not set correctly.'
    );
}

const env = NODE_ENV;
logger.info(`Will connect to postgres`);

const knexConfigurations = require('./knexfile');
const database = Knex(knexConfigurations[env]);

database('logs')
    .insert({
        txt: 'Checking db connection on app server start.',
        source: '/db/index',
        createAt: new Date()
    })
    .then(() => {
        logger.info(`Connected to database - OK`);
    })
    .catch(err => {
		logger.error(err);
		logger.warn('[db-error]: Application will be shut down.');
        process.exit(1);
    });

export default database;
module.exports = database;