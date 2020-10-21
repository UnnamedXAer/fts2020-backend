import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import HttpException from '../utils/HttpException';

export const redirectToInvitation: RequestHandler = async (req, res, next) => {
	const token: string = req.params['token'];

	if (!token) {
		return next(new HttpException(HttpStatus.BAD_REQUEST, 'Wrong request.'));
	}

	if (req.headers['user-agent']) {
		if (req.headers['user-agent'].indexOf('Android') > -1) {
			res.redirect(`${process.env.MOBILE_APP_URL}/invitations/${token}`);
		} else {
			res.redirect(`${process.env.WEB_APP_URL}/invitation/${token}`);
		}
	} else {
		const txt = `
		<div style="font-size: 2.5em;">\n
			<p>${JSON.stringify(req.query, null, '\t')}</p>\n
			<hr/>\n
			<p>WEB_APP_URL: ${process.env.WEB_APP_URL}</p>
			<p>MOBILE_APP_URL: ${process.env.MOBILE_APP_URL}</p>
			<p>${token}</provider>
			<script>\n
				function go() {
					window.open((navigator.userAgent.indexOf("Android") === -1 ? 
						"${process.env.WEB_APP_URL}/invitation/${token}"
						: "${process.env.MOBILE_APP_URL}/invitations/${token}"),
					"_self");
				}\n
			</script>\n
			<button style="font-size: 2.5em; color:green;" onclick="go()">Open inv</button>\n
		</div>`;
		res.status(200).send(txt);
	}
};
