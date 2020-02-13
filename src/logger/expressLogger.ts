import { transports } from 'winston';
import expressWinston from 'express-winston';
import { consoleTransportFormat } from './loggerHelpers';

export const expressWinstonLogger = expressWinston.logger({
	transports: [new transports.Console()],
	format: consoleTransportFormat,
	meta: true, // optional: control whether you want to log the meta data about the request (default to true)
	// msg: 'HTTP {{req.method}} {{req.url}} -> {{res.statusCode}}, resTime: {{res.responseTime}}ms', 
	expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
	colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
	// dynamicMeta: (req, _res) => ({
	// 	user: (<UserModel>req.user)?.emailAddress
	// }),
	statusLevels: {}
});
