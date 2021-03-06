import { RequestHandler } from 'express';
import HttpException from '../utils/HttpException';

const ensureAuthenticated: RequestHandler = (req, _, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	return next(
		new HttpException(401, 'Unauthorized access.', {
			no_user_logged: true
		})
	);
};

export default ensureAuthenticated;
