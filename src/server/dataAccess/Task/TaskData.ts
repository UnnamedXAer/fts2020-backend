import knex from '../../../db';
import { TaskRow } from '../../CustomTypes/DbTypes';
import TaskModel from '../../Models/TaskModel';
import logger from '../../../logger';

class TaskData {
	static async getAll() {
		try {
			const results: TaskRow[] = await knex('task').select('*');

			const tasks = results.map(async row => {
				const membersResults: number[][] = await knex('taskMembers')
					.select('userId')
					.where({ taskId: row.id });

				const task = new TaskModel({
					id: row.id,
					flatId: row.flatId,
					title: row.title,
					description: row.description,
					startDate: row.startDate,
					endDate: row.endDate,
					timePeriod: row.timePeriod,
					active: row.active,
					members: membersResults[0],
					createBy: row.createBy,
					createAt: row.createAt
				});

				logger.debug('Task: %o', task);
				return task;
			});
			logger.debug('[TaskData].getAll TasksCnt: %s', tasks.length);
			return tasks;
		} catch (err) {
			logger.debug('[TaskData].getAll error: %o', err);
			throw err;
		}
	}

	static async getByFlat(id: number) {
		try {
			const results: TaskRow[] = await knex('tasks')
				.select('*')
				.where({ flatId: id });

			const tasks = results.map(async row => {
				const membersResults: number[][] = await knex('taskMembers')
					.select('userId')
					.where({ taskId: row.id });

				const task = new TaskModel({
					id: row.id,
					flatId: row.flatId,
					title: row.title,
					description: row.description,
					startDate: row.startDate,
					endDate: row.endDate,
					timePeriod: row.timePeriod,
					active: row.active,
					members: membersResults[0],
					createBy: row.createBy,
					createAt: row.createAt
				});

				logger.debug('Task: %o', task);
				return task;
			});
			logger.debug('FlatId: %s, TasksCnt: %s', id, tasks.length);
			return tasks;
		} catch (err) {
			throw err;
		}
	}

	static async create(task: TaskModel, loggedUserId) {
		const currentDate = new Date();

		const taskData = {
			active: true,
			createAt: currentDate,
			createBy: loggedUserId,
			description: task.description,
			flatId: task.flatId,
			lastModAt: currentDate,
			lastModBy: loggedUserId,
			timePeriod: task.timePeriod,
			
		} as TaskRow;
	}
}

export default TaskData;
