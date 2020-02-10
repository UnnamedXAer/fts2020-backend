import { createLogger, transports, format } from 'winston';
import path from 'path';

const Logger = createLogger({
	format: format.combine(
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		format.errors({ stack: true }),
		format.splat(),
		format.json()
	),
	defaultMeta: 'FTS-2020',
	transports: [
		new transports.File({
			level: 'info',
			filename: 'all-logs.log',
			handleExceptions: true,
			dirname: path.join(__dirname, '../../logs'),
			maxsize: 5,
			maxFiles: 10
		})
	]
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
	Logger.add(
		new transports.Console({
			format: format.combine(
				format.colorize({ all: true }),
				format.simple()
			)
		})
	);
}

export default Logger;

// ***************
// Allows for JSON logging
// ***************

Logger.log({
	level: 'info',
	message: 'Pass an object and this works',
	additional: 'properties',
	are: 'passed along'
});

Logger.info({
	message: 'Use a helper method if you want',
	additional: 'properties',
	are: 'passed along'
});

// ***************
// Allows for parameter-based logging
// ***************

Logger.log('info', 'Pass a message and this works', {
	additional: 'properties',
	are: 'passed along'
});

Logger.info('Use a helper method if you want', {
	additional: 'properties',
	are: 'passed along'
});

// ***************
// Allows for string interpolation
// ***************

// info: test message my string {}
Logger.log('info', 'test message %s', 'my string');

// info: test message my 123 {}
Logger.log('info', 'test message %d', 123);

// info: test message first second {number: 123}
Logger.log('info', 'test message %s, %s', 'first', 'second', { number: 123 });

// prints "Found error at %s"
Logger.info('Found %s at %s', 'error', new Date());
Logger.info('Found %s at %s', 'error', new Error('chill winston'));
Logger.info('Found %s at %s', 'error', /WUT/);
Logger.info('Found %s at %s', 'error', true);
Logger.info('Found %s at %s', 'error', 100.0);
Logger.info('Found %s at %s', 'error', ['1, 2, 3']);

// ***************
// Allows for logging Error instances
// ***************

Logger.warn(new Error('Error passed as info'));
Logger.log('Error', 'Error passed as message');

Logger.warn('Maybe important error: ', new Error('Error passed as meta'));
Logger.log('error', 'Important error: ', new Error('Error passed as meta'));

Logger.error(new Error('Error as info'));
