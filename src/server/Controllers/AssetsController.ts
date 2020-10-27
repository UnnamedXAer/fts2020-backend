import { RequestHandler } from 'express';
import path from 'path';
import HttpStatus from 'http-status-codes';
import logger from '../../logger';
import HttpException from '../utils/HttpException';
import { validationResult, param } from 'express-validator';

export const getScreenByName: RequestHandler[] = [
	param('screenName').custom((screenName) =>
		new RegExp('[a-zA-Z0-9-]+(.png)$').test(screenName)
	),
	async (req, res, next) => {
		const screenName = req.params.screenName;
		const valid = new RegExp('[a-zA-Z0-9-]+(.png)$').test(screenName);
		console.log('valid', valid);
		logger.info('assets/screens/%s', screenName);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors.array().map((x) => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(HttpStatus.BAD_REQUEST, 'Invalid parameter.', {
					errorsArray
				})
			);
		}

		try {
			res.status(200).sendFile(path.resolve(__dirname, '../../assets/screens/', screenName));
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	}
];
