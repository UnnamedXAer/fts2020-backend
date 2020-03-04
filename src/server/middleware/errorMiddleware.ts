import { Request, Response, NextFunction } from 'express';
import HttpException from '../utils/HttpException';
import logger from '../../logger';
import { loggedUserId } from '../utils/authUser';

export default function errorMiddleware(
	err: HttpException,
	req: Request,
	res: Response,
	_next: NextFunction
) {
	const env = process.env.NODE_ENV;
	const status =
		err.statusCode ||
		(res.statusCode && res.statusCode >= 400 ? res.statusCode : void 0) ||
		500;
	const message =
		env === 'production' && status === 500
			? 'Something went wrong'
			: err.message;
	const data = err.data || {};

	if (!err.logsHandled) {
		const logData = {
			hostname: req.hostname,
			url: req.url,
			message: err.message,
			additionalData: err.data,
			status: {
				errStatusCode: err.statusCode,
				resStatusCode: res.statusCode
			},
			env: env,
			user: loggedUserId(req)
		};
		if (status >= 500) {
			Object.assign(logData, { stack: err.stack });
			logger.error(
				'[%s] %s %o',
				req.method,
				req.url,
				JSON.stringify(logData)
			);
		} else {
			logger.warn(
				'[%s] %s %O',
				req.method,
				req.url,
				JSON.stringify(logData)
			);
		}
	}
	const resObj = {
		message,
		status,
		data
	};
	res.status(status).send(resObj);
}
