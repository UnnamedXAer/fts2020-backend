import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import HttpException from '../utils/HttpException';
import FlatData from '../DataAccess/Flat/FlatData';
import FlatModel from '../Models/FlatModel';
import { body } from 'express-validator';
import UserModel from '../Models/UserModel';

export const getFlats: RequestHandler = async (_req, res, next) => {
	try {
		const flats = await FlatData.getAll();

		res.status(HttpStatus.OK).send(flats);
	} catch (err) {
		next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};

export const create: RequestHandler[] = [
	body('name')
		.trim()
		.escape()
		.isLength({ min: 2 })
		.withMessage('Name must be 2+ chars long.')
		.isLength({ max: 50 })
		.withMessage('Name must be 50 max chars long.'),
	async (req, res, next) => {

		const { address, members, name } = req.body as FlatModel;

		try {
			const createdFlat = await FlatData.create(
				new FlatModel({
					address,
					members,
					name,
					createAt: new Date(),
					createBy: (<UserModel>req.user).id
				})
			);

			res.status(HttpStatus.CREATED).json(createdFlat);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	}
];
