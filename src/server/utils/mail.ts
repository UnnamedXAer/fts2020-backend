import logger from '../../logger';

export const sendMail = async (_email: string, _content: string) => {
	// https://nodemailer.com/about/

	// const transporter = nodemailer.createTransport({
	// 	service: 'gmail',
	// 	auth: {
	// 		user: process.env.EMAIL_ADDRESS,
	// 		pass: process.env.EMAIL_ADDRESS_PASSWORD,
	// 	},
	// });
	// const transporter = nodemailer.createTransport({
	// 	host: "smtp.mailtrap.io",
	// 	port: 2525,
	// 	auth: {
	// 	  user: "1293b1feb85c7f",
	// 	  pass: "a862b6024326ae"
	// 	}
	//   });

	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing
	// let testAccount = await nodemailer.createTestAccount();

	// // create reusable transporter object using the default SMTP transport
	// let transporter = nodemailer.createTransport({
	// 	host: 'smtp.ethereal.email',
	// 	port: 587,
	// 	secure: false, // true for 465, false for other ports
	// 	auth: {
	// 		user: testAccount.user, // generated ethereal user
	// 		pass: testAccount.pass, // generated ethereal password
	// 	},
	// });

	// const transporter = nodemailer.createTransport({
	//     host: 'smtp.ethereal.email',
	//     port: 587,
	//     auth: {
	//         user: 'cristobal.oberbrunner9@ethereal.email',
	//         pass: '834muBfYe4JT23EPuP'
	//     }
	// });

	// const mailOptions = {
	// 	// from: '"FTS2020" <no-replay@fts2020.com>', // sender address
	// 	from: testAccount.user, // sender address
	// 	to:
	// 		email +
	// 		', 135d7f4bd7-78aa55@inbox.mailtrap.io, workmailsts1@gmail.com', // list of receivers
	// 	subject: 'FTS2020', // Subject line
	// 	text: 'It’s test message sent from FTS2020',
	// 	html: content, // plain text body
	// } as MailOptions;

	try {
		// const results = await transporter.sendMail(mailOptions);
		// return results;
		throw new Error('"sendMail" method not implemented yet.');
	} catch (err) {
		// const errorTxt = JSON.stringify(err, null, '\t');
		logger.error(err);
	}
};
