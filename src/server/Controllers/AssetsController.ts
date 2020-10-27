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

		const screenPath = path.resolve(__dirname, '../../assets/screens/', screenName);
		logger.debug('About to send asset: %s', screenPath);
		try {
			res.status(200).sendFile(screenPath);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	}
];
