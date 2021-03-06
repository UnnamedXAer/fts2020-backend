import { format } from "winston";

require('dotenv').config();
const showStack = process.env.LOGGER_SHOW_STACK === 'TRUE';

export const consoleTransportFormat = format.combine(
	format.colorize(),
	format.label({ label: '[app-server]' }),
	format.timestamp(),
	format.splat(),
	format.printf(info => {
		return (
			`${info.label} ${info.timestamp} ${info.ms? '('+info.ms+') ' : ''}${info.level}: ${info.message}` +
			(showStack && info.stack ? `\nStack: ${info.stack}` : '')
		);
	})
);
