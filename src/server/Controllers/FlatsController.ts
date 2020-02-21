import { RequestHandler, Request } from 'express';
import HttpStatus from 'http-status-codes';
import HttpException from '../utils/HttpException';
import FlatData from '../DataAccess/Flat/FlatData';
import FlatModel from '../Models/FlatModel';
import { body, validationResult } from 'express-validator';
import logger from '../../logger';
import { loggedUserId } from '../utils/authUser';

export const getFlats: RequestHandler = async (req, res, next) => {
	logger.debug(
		'[GET] /flats/ a user %s try to get all flats: %o',
		loggedUserId(req)
	);
	try {
		const flats = await FlatData.getAll();

		res.status(HttpStatus.OK).send(flats);
	} catch (err) {
		next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};

export const create: RequestHandler[] = [
	body('name')
		.isString()
		.withMessage('That is not correct value for name')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Name must be 2+ chars long.')
		.isLength({ max: 50 })
		.withMessage('Name cannot be more than 50 chars long.')
		.custom(async (value: string, { req }) => {
			try {
				const exists = await FlatData.verifyIfMember(
					loggedUserId(<Request>req),
					value
				);
				if (exists) {
					throw new Error(
						'You are already member of flat with this name.'
					);
				}
			} 
			catch (err) {
				const errorMessage =
					process.env.NODE_ENV == 'development'
						? err.message
						: 'Something went wrong during validation.';
				throw new Error(errorMessage);
			}
		}),
	body('address')
		.if((value: any) => {
			console.log('address', value);
			return typeof value === 'string' && value.trim().length > 0;
		})
		.trim()
		.isLength({ max: 200 })
		.withMessage('Address cannot be more than 200 chars long.'),
	body('members')
		.optional()
		.isArray()
		.withMessage('That is not correct value for members')
		.if((value: any) => Array.isArray(value) && value.length > 0)
		.custom((value: []) => value.length <= 20)
		.withMessage(
			`It's rather not true that You live with more than 20 people in a flat or house.
			If I'm wrong please let me know.`
		)
		.custom((value: []) => {
			const everyOutput = value.every(x => {
				const output = Number.isInteger(x) && x > 0;
				return output;
			});
			return everyOutput;
		})
		.withMessage(
			'That is not correct values for members - not an positive integers.'
		),
	async (req, res, next) => {
		logger.debug(
			'[POST] /flats/ user (%s) try to create flat: %o',
			loggedUserId(req),
			{ ...req.body }
		);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errorsArray = errors
				.array()
				.map(x => ({ msg: x.msg, param: x.param }));
			return next(
				new HttpException(422, 'Not all conditions are fulfilled', {
					errorsArray
				})
			);
		}

		let { address, members, name } = req.body as FlatModel;
		name = name?.trim();
		address = address?.trim();

		try {
			const createdFlat = await FlatData.create(
				new FlatModel({
					address,
					members,
					name
				}),
				loggedUserId(req)
			);

			res.status(HttpStatus.CREATED).json(createdFlat);
		} catch (err) {
			next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
		}
	}
];
