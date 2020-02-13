import { createLogger, transports, format } from 'winston';
import path from 'path';

import { consoleTransportFormat } from './loggerHelpers';
const logger = createLogger({
	level: process.env.TRACE_LEVEL,
	format: format.combine(
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		format.errors({ stack: true }),
		format.splat(),
		format.json({ space: 4 }),
		format.ms(),
		format.label({ label: '[FTS 2020-server]' }),
		format.printf(info => {
			return (
				`${info.label} ${info.timestamp} (${info.ms}) ${info.level}: ${info.message}` +
				(info.stack ? '\nStack: ' + info.stack : '')
			);
		})
	),
	defaultMeta: { service: 'FTS-2020' },
	transports: [
		new transports.File({
			level: 'info',
			filename: 'all-logs.log',
			handleExceptions: false,
			dirname: path.join(__dirname, './../../logs'),
			maxsize: 5 * 1024,
			maxFiles: 10
		}),
		new transports.File({
			level: 'error',
			filename: 'error-logs.log',
			handleExceptions: false,
			dirname: path.join(__dirname, './../../logs/errors'),
			maxsize: 5 * 1024,
			maxFiles: 10
		})
	],
	exitOnError: false
});

if (process.env.NODE_ENV !== 'production') {
	logger.add(
		new transports.Console({
			format: consoleTransportFormat,
			handleExceptions: false
		})
	);
}
logger.log(process.env.TRACE_LEVEL!, 'logger: TRACE_LEVEL: %s', process.env.TRACE_LEVEL);

export default logger;
module.exports = logger;
