import { transports } from "winston";
import expressWinston from 'express-winston';
import { consoleTransportFormat } from './loggerHelpers';

export const expressWinstonLogger = expressWinston.logger({
	transports: [new transports.Console()],
	format: consoleTransportFormat,
	meta: false, // optional: control whether you want to log the meta data about the request (default to true)
	msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
	expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
	// colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
	// ignoreRoute: function(_req, _res) {
	// 	return false;
	// } // optional: allows to skip some log messages based on request and/or response
});