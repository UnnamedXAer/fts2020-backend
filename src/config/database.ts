const env = (process.env.NODE_ENV as 'production' | 'development' | undefined) || 'development';
import config from '../knexfile';

if (env != 'development' || env != 'development') {
	throw new Error('Invalid Environment Setup: "NODE_ENV" is not set correctly.');
}
const knex = require('knex')(config[env]);

export default knex;
