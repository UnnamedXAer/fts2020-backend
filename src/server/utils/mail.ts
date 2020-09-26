import logger from '../../logger';
import nodemailer, { SendMailOptions } from 'nodemailer';

export const sendMail = async (sendOptions: SendMailOptions) => {
	const debugModeOn = process.env.DEBUG_EMAILS === 'TRUE';
	logger.debug(
		'[sendMail]: emails are send in ' + (debugModeOn ? 'DEBUG' : 'NORMAL') + ' mode.'
	);

	const transportOptions = debugModeOn
		? {
				host: 'localhost',
				port: 1025,
				auth: {
					user: 'project.1',
					pass: 'secret.1',
				},
		  }
		: {
				service: 'gmail',
				auth: {
					user: process.env.EMAIL_ADDRESS,
					pass: process.env.EMAIL_ADDRESS_PASSWORD,
				},
		  };

	const transporter = nodemailer.createTransport(transportOptions);

	const mailOptions = {
		from: '"FTS2020" <no-replay@fts2020.com>',
		...sendOptions,
	} as SendMailOptions;

	try {
		const results = await transporter.sendMail(mailOptions);
		if (results !== void 0) {
			// debugger;
		}
		logger.debug('Email sent to: ' + sendOptions.to);
		return results;
	} catch (err) {
		logger.error('Unable to send mail to: %s / ' + err.message, sendOptions.to);
		throw err;
	}
};
