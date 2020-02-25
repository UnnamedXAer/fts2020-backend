import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import TaskData from '../DataAccess/Task/TaskData';
import HttpException from '../utils/HttpException';
import { loggedUserId } from '../utils/authUser';
import logger from '../../logger';

export const getAll: RequestHandler = async (req, res, next) => {
	logger.debug(
		'[GET] /tasks/ a user %s try to get all tasks: %o',
		loggedUserId(req)
	);
	try {
		const tasks = await TaskData.getAll();
		res.status(HttpStatus.OK).json(tasks);
	}
	catch(err) {
		next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
}