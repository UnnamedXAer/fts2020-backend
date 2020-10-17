import logger from '../logger';
logger.info('START');
import { app } from './app';
import normalizePort from './utils/normalizePort';

var PORT = normalizePort(process.env.PORT || 3330);
const server = require('http').createServer(app);

server.listen(PORT, function () {
	const address = server.address();
	logger.info(
		'Server is listening on: %s. ',
		process.env.NODE_ENV === 'development'
			? `http://localhost:${PORT}`
			: address
			? `${address.address}:${address.port}`
			: PORT
	);
	logger.debug('Process id: %s', process.pid);
});
