import { Request, Response, NextFunction } from 'express';
import HttpException from '../utils/HttpException';
import logger from '../../logger';

export default function errorMiddleware(
	err: HttpException,
	req: Request,
	res: Response,
	_next: NextFunction
) {
	const env = process.env.NODE_ENV;
	const status = err.statusCode || res.statusCode || 500;
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
			user: req.user
		};
		if (status >= 500) {
			Object.assign({stack: err.stack}, logData);
			logger.error('%o', logData);
		} else {
			logger.warn('%o', logData);
		}
	}
	const resObj = {
		message,
		status,
		data
	};
	res.status(status).send(resObj);
}
