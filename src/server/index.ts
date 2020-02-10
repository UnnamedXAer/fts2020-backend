import logger from '../logger';
logger.info('START');
import { app } from './app';
import normalizePort from './utils/normalizePort';

var PORT = normalizePort(process.env.PORT || 3330);
const server = require('http').createServer(app);

server.listen(PORT, () => {
    logger.info('Server is listening on: %s', `http://localhost:${PORT}`);
});