import { Request, Response, NextFunction} from 'express';
import HttpException from '../utils/HttpException';
import logger from '../../logger';

export default function errorMiddleware(err: HttpException, _req: Request, res: Response, _next: NextFunction) {
	console.log(typeof err)
	const status = err.statusCode || res.statusCode || 500;
	const message = err.message;
	const data = err.data || {};

	const resObj = {
		message,
		status,
		data
	};
	if (status === 500) {
		logger.error('%o', resObj);
	}
	else {
		logger.warn('%o', resObj);
	}

	res.status(status).send(resObj);
};