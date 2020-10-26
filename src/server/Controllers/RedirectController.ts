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
			<script>
				window.open((navigator.userAgent.indexOf("Android") === -1 ? 
					"${process.env.WEB_APP_URL}/invitation/${token}"
					: "${process.env.MOBILE_APP_URL}/invitations/${token}"),
				"_self");
			</script>`;
		res.status(200).send(txt);
	}
};
