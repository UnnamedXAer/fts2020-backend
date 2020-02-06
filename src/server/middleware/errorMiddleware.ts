import { Request, Response, NextFunction} from 'express';
import HttpException from '../utils/HttpException';

export default function errorMiddleware(err: HttpException, _req: Request, res: Response, _next: NextFunction) {
	const status = err.statusCode || res.statusCode || 500;
	const message = err.message;
	const data = err.data || {};

	res.status(status).send({
		message,
		status,
		data
	});
};