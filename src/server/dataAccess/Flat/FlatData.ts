import FlatModel from '../../Models/FlatModel';
import knex from '../../../db';
import logger from '../../../logger';
import { FlatRow } from '../../CustomTypes/DbTypes';

class FlatData {

	static async getAll() {
		try {
			const results: FlatRow[] = await knex('flat').select('*');
			const flats = results.map(async flat => {
				const membersResults: number[][] = await knex('flatMembers')
					.select('userId')
					.where({ flatId: flat.id });

				return new FlatModel({
					id: flat.id,
					name: flat.name,
					address: flat.address,
					createBy: flat.createBy,
					createAt: flat.createAt,
					members: membersResults[0]
				});
			});

			logger.debug('[FlatData].getAll flatCnt: %s', flats.length);
			return flats;
		} catch (err) {
			logger.debug('[FlatData].getAll error: %o', err);
			throw err;
		}
	}

	static async create(flat: FlatModel): Promise<FlatModel> {
		try {
			const results: FlatRow[] = await knex('flat').insert({
				name: flat.name,
				address: flat.address,
				createAt: flat.createAt,
				createBy: flat.createBy,
				lastModAt: new Date(),
				lastModBy: flat.createBy
			} as FlatRow).returning('*');
			// members will be add later
			const createdFlat = new FlatModel({...flat, id: results[0].id});
			logger.debug('[FlatData].create flat: %o', createdFlat);
			return createdFlat;
		}
		catch (err) {
			logger.debug('[FlatData].create error: %o', err);
			throw err;
		}
	}
}

export default FlatData;