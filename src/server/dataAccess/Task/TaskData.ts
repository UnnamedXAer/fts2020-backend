import knex from '../../../db';
import logger from '../../../logger';
import { TaskRow, TaskMembersRow } from '../../CustomTypes/DbTypes';
import TaskModel from '../../Models/TaskModel';
import { TaskMemberModel } from '../../Models/TaskMemberModel';

class TaskData {
	static async getAll() {
		try {
			const results: TaskRow[] = await knex('task').select('*');

			const tasks = [];
			for (let i = 0; i < results.length; i++) {
				const taskRow = results[i];
				const membersResults = await this.getMembers(taskRow.id);
				const task = this.mapTaskDataToModel(taskRow, membersResults);
				logger.silly('[TaskData].getAll Task: %o', task);
				tasks.push(task);
			}

			logger.debug('[TaskData].getAll Tasks Count: %s', tasks.length);
			return tasks;
		} catch (err) {
			logger.debug('[TaskData].getAll error: %o', err);
			throw err;
		}
	}

	static async getById(id: number) {
		try {
			const results: TaskRow[] = await knex('task')
				.select('*')
				.where({ id });

			let task = null;
			if (results.length > 0) {
				const membersResults = await this.getMembers(id);
				task = this.mapTaskDataToModel(results[0], membersResults);
			}

			logger.debug('[TaskData].getById given id: %s, Task: %s', id, task);
			return task;
		} catch (err) {
			throw err;
		}
	}

	static async getByFlat(id: number) {
		try {
			const results: TaskRow[] = await knex('tasks')
				.select('*')
				.where({ flatId: id });

			const tasks = results.map(async row => {
				const membersResults = await this.getMembers(id);
				const task = this.mapTaskDataToModel(row, membersResults);
				logger.silly(
					'[TaskData].getByFlatId FlatId: %s, Task: %o',
					task
				);
				return task;
			});
			logger.debug(
				'[TaskData].getByFlatId FlatId: %s, Tasks Count: %s',
				id,
				tasks.length
			);
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
			const createdTask = await knex.transaction(async trx => {
				const results: TaskRow[] = await trx('task')
					.insert(taskData)
					.returning('*');

				const createdTask = this.mapTaskDataToModel(results[0]);
				return createdTask;
			});

			logger.debug('[TaskData].create flat: %o', createdTask);
			return createdTask;
		} catch (err) {
			logger.debug('[TaskData].create error: %o', err);
			throw err;
		}
	}

	static async delete(id: number, userId: number) {
		try {
			let results = await knex.transaction(async trx => {
				await trx('taskMembers')
					.delete()
					.where({ taskId: id });

				const deletedTasksCountResults = await trx('task')
					.delete()
					.where({ id });

				return deletedTasksCountResults;
			});

			logger.debug(
				'[TaskData].delete task: %s delete by: %s, deleted tasks count: %s',
				id,
				userId,
				results
			);

			return results;
		} catch (err) {
			logger.debug('[TaskData].delete error: %o', err);
			throw err;
		}
	}

	static async getMembers(taskId: number) {
		try {
			const results: TaskMembersRow[] = await knex('taskMembers')
				.select('userId', 'position')
				.where({ taskId });

			const members = results.map(
				x => <TaskMemberModel>{ userId: x.userId, position: x.position }
			);
			logger.debug(
				'[TaskData].getMembers existing members for task: %s are: %o',
				taskId,
				members
			);
			return members;
		} catch (err) {
			logger.debug('[TaskData].getMembers error: %o', err);
			throw err;
		}
	}

	static async setMembers(
		taskId: number,
		members: TaskMemberModel[],
		signedInUserId: number
	) {
		try {
			const insertDate = new Date();
			const membersData = members.map(
				x =>
					<TaskMembersRow>{
						userId: x.userId,
						taskId,
						addedAt: insertDate,
						addedBy: signedInUserId,
						position: x.position
					}
			);

			await knex('taskMembers')
				.delete()
				.where({ taskId });

			const results: TaskMembersRow[] | {} = await knex('taskMembers')
				.insert(membersData)
				.returning(['userId', 'position']);

			let addedMembers: TaskMembersRow[];
			if (Array.isArray(results)) {
				addedMembers = results;
			} else {
				addedMembers = [];
			}
			logger.debug(
				'[TaskData].addMembers added members for: %s are: %o',
				taskId,
				addedMembers
			);

			return addedMembers;
		} catch (err) {
			logger.debug('[FlatData].addMembers error: %o', err);
			throw err;
		}
	}

	private static mapTaskDataToModel(
		row: TaskRow,
		members: TaskMemberModel[] = []
	) {
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
