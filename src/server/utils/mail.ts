import logger from '../../logger';
import nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/sendmail-transport';

export const sendMail = async (email: string, subject: string, content: string, plainContent?: string) => {

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_ADDRESS,
			pass: process.env.EMAIL_ADDRESS_PASSWORD,
		},
	});

	const mailOptions = {
		from: '"FTS2020" <no-replay@fts2020.com>',
		to: email,
		subject: subject,
		text: plainContent,
		html: content,
	} as MailOptions;

	try {
		const results = await transporter.sendMail(mailOptions);
		if (results !== void 0) {
			debugger
		}
		logger.debug('Email sent to: ' + email);
		return results;
	} catch (err) {
		logger.error(err);
	}
};
