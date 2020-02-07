import { RequestHandler } from 'express';
import UserData from '../DataAccess/User/UserData';

export const getById: RequestHandler = async (req, res, next) => {
	const id = +req.params['id'];
	console.log('user/:id ( id: %O )', id);
	try {
		const user = await UserData.getById(id);
		const statusCode = user ? 200 : 204;
		res.status(statusCode).json(user);
	} catch (err) {
		console.log(err);
		next(err);
	}
};
