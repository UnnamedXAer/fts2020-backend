import knex from '../../../db';
import LogModel from '../../models/LogModel';
import { LogRow } from '../../customTypes/DbTypes';

class LogsData {
	static async getAll() {
		try {
			const results: LogRow[] = await knex('logs').select('*');
			const logs = results.map(row => {
				const log = new LogModel(
					row.txt,
					row.createAt,
					row.createBy,
					row.source,
					row.id
				);
				return log;
			});

			return logs;
		} 
		catch (err) {
			throw err;
		}
	}

	static async insert(log: LogModel) {
		try {
			const id: number = await knex('logs')
				.insert({
					log
				})
				.returning('id');
			return id;
		} 
		catch (err) {
			throw err;
		}
	}
}

export default LogsData;
