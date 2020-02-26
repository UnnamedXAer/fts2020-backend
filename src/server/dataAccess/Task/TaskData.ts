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

				const task = this.mapTaskDataToModel(row, membersResults[0]);

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

				const task = this.mapTaskDataToModel(row, membersResults[0]);

				logger.debug('Task: %o', task);
				return task;
			});
			logger.debug('FlatId: %s, TasksCnt: %s', id, tasks.length);
			return tasks;
		} catch (err) {
			throw err;
		}
	}

	static async create(task: TaskModel, loggedUserId: number) {
		const currentDate = new Date();

		const taskData = {
			active: true,
			createAt: currentDate,
			createBy: loggedUserId,
			description: task.description,
			flatId: task.flatId,
			lastModAt: currentDate,
			lastModBy: loggedUserId,
			startDate: task.startDate,
			endDate: task.endDate,
			title: task.title,
			timePeriodUnit: task.timePeriodUnit,
			timePeriodValue: task.timePeriodValue
		} as TaskRow;

		try {
			const createdTask = knex.transaction(async trx => {
				const results: TaskRow[] = await trx('task')
					.insert(taskData)
					.returning('*');

				const createdTask = this.mapTaskDataToModel(results[0]);
				return createdTask;
			});

			logger.debug('[FlatData].create flat: %o', createdTask);
			return createdTask;
		} catch (err) {
			logger.debug('[Task].create error: %o', err);
			throw err;
		}
	}

	private static mapTaskDataToModel(row: TaskRow, members?: number[]) {
		return new TaskModel({
			id: row.id,
			flatId: row.flatId,
			title: row.title,
			description: row.description,
			startDate: row.startDate,
			endDate: row.endDate,
			timePeriodUnit: row.timePeriodUnit,
			timePeriodValue: row.timePeriodValue,
			active: row.active,
			members: members,
			createBy: row.createBy,
			createAt: row.createAt
		});
	}
}

export default TaskData;
