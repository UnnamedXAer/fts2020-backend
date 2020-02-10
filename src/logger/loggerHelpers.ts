import { format } from "winston";

require('dotenv').config();
const showStack = process.env.SHOW_STACK_IN_LOGS === 'TRUE';

export const consoleTransportFormat = format.combine(
	format.colorize(),
	format.label({ label: '[app-server]' }),
	format.timestamp(),
	format.splat(),
	format.printf(info => {
		return (
			`${info.timestamp} ${info.level}: ${info.message}` +
			(showStack && info.stack ? `\nStack: ${info.stack}` : '')
		);
	})
);
