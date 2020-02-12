import { RequestHandler } from 'express';
import UserData from '../DataAccess/User/UserData';
import logger from '../../logger';
import HttpException from '../utils/HttpException';

export const getById: RequestHandler = async (req, res, next) => {
	logger.info('user/:id ( id: %O )', req.params['id']);
	const id = +req.params['id'];
	if (isNaN(id) || id < 1) {
		return next(new HttpException(404, 'Incorrect user Id'));
	}
	try {
		const user = await UserData.getById(id);
		const statusCode = user ? 200 : 204;
		res.status(statusCode).json(user);
	} catch (err) {
		next(new HttpException(500, err));
	}
};
