import knex from '../../../db';
import logger from '../../../logger';
import {
	TaskRow,
	TaskMembersRow,
	UserRow,
} from '../../customTypes/DbTypes';
import TaskModel from '../../models/TaskModel';
import { TaskMemberModel } from '../../models/TaskMemberModel';
import UserModel from '../../models/UserModel';
import UserTaskModel from '../../models/UserTaskModel';
import PeriodData from '../PeriodData/PeriodData';
import Knex from 'knex';

class TaskData {
	static async getById(id: number) {
		try {
			const results: TaskRow[] = await knex('task')
				.select('*')
				.where({ id });

			let task = null;
			if (results.length > 0) {
				const membersResults = (await this.getMembers(id)).map(
					(x) => x.id
				);
				task = this.mapTaskDataToModel(results[0], membersResults);
			}

			logger.debug(
				'[TaskData].getById id: %s, Task: %o',
				id,
				task ? task.id : null
			);
			return task;
		} catch (err) {
			throw err;
		}
	}

	static async getByFlat(id: number) {
		try {
			const results: TaskRow[] = await knex('task')
				.select('*')
				.where({ flatId: id });

			const tasksPromises = results.map(async (row) => {
				const membersResults = (await this.getMembers(id)).map(
					(x) => x.id
				);
				const task = this.mapTaskDataToModel(row, membersResults);
				return task;
			});
			const tasks = await Promise.all(tasksPromises);
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

	static async getByUser(id: number) {
		try {
			const tasksIdsQuery = knex('taskMembers')
				.select('taskId')
				.where({ userId: id });

			const results: (TaskRow & { flatName: string })[] = await knex
				.from('task')
				.join('flat', 'flat.id', '=', 'flatId')
				.select('task.*', 'flat.name as flatName')
				.whereIn('task.id', tasksIdsQuery);

			const tasksPromises = results.map(async (row) => {
				const task = new UserTaskModel({
					id: row.id,
					flatId: row.flatId,
					title: row.title,
					flatName: row.flatName,
					timePeriodUnit: row.timePeriodUnit,
					timePeriodValue: row.timePeriodValue,
					active: row.active,
				});

				return task;
			});
			const tasks = await Promise.all(tasksPromises);
			logger.debug(
				'[TaskData].getByUser userId: %s, Tasks Count: %s',
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
			timePeriodValue: task.timePeriodValue,
		} as TaskRow;

		const members: number[] = task.members!;

		try {
			const createdTask = await knex.transaction(async (trx) => {
				const results: TaskRow[] = await trx('task')
					.insert(taskData)
					.returning('*');

				const createdTaskId = results[0].id;
				const membersData: TaskMembersRow[] = members.map((x, i) => ({
					userId: x,
					addedAt: currentDate,
					addedBy: loggedUserId,
					position: i + 1,
					taskId: createdTaskId,
				}));

				const membersResults = await trx('taskMembers')
					.insert(membersData)
					.returning<number[]>('userId');

				const createdTask = this.mapTaskDataToModel(
					results[0],
					membersResults
				);

				return createdTask;
			});

			logger.debug('[TaskData].create flat: %o', createdTask);
			return createdTask;
		} catch (err) {
			logger.debug('[TaskData].create error: %o', err);
			throw err;
		}
	}

	static async update(task: Partial<TaskModel>, loggedUserId: number) {
		const currentDate = new Date();

		const taskData = {
			active: task.active,
			description: task.description,
			lastModAt: currentDate,
			lastModBy: loggedUserId,
			title: task.title,
		} as Partial<TaskRow>;

		try {
			const results = await knex
				.table('task')
				.update(taskData)
				.where({ id: task.id! })
				.returning('*');

			const updatedTask = this.mapTaskDataToModel(results[0]);

			logger.debug('[TaskData].update task: %o', updatedTask);
			return updatedTask;
		} catch (err) {
			logger.debug('[TaskData].update error: %o', err);
			throw err;
		}
	}

	static async delete(id: number, userId: number) {
		try {
			let results = await knex.transaction(async (trx) => {
				await trx('taskMembers').delete().where({ taskId: id });

				const deletedTasksCountResults = await trx('task')
					.delete()
					.where({ id });

				return deletedTasksCountResults;
			});

			logger.debug(
				'[TaskData].delete task: %s delete by: %s, delete count: %s',
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
			const results: UserRow[] = await knex<UserRow[]>('taskMembers')
				.join('appUser', 'appUser.id', '=', 'userId')
				.select('appUser.*')
				.where({ taskId })
				.orderBy('taskMembers.position', 'asc');

			const members = results.map(
				(x) =>
					new UserModel(
						x.id!,
						x.emailAddress,
						x.userName,
						void 0,
						x.provider,
						x.joinDate,
						x.avatarUrl,
						x.active
					)
			);
			logger.debug(
				'[TaskData].getMembers task ID: %s members count: %s',
				taskId,
				members.length
			);
			return members;
		} catch (err) {
			logger.debug('[TaskData].getMembers error: %o', err);
			throw err;
		}
	}

	static async deleteMembers(
		taskId: number,
		members: number[] | number | null,
		signedInUserId: number,
		trx: Knex.Transaction
	) {
		try {
			let results: number;
			if (members === null) {
				results = await trx('taskMembers').delete().where({ taskId });
			} else {
				let membersToRemove =
					typeof members === 'number' ? [members] : members;
				results = await trx('taskMembers')
					.delete()
					.whereIn('userId', membersToRemove)
					.andWhere({ taskId });
			}

			logger.debug(
				'[TaskData].deleteMembers task: %s current members cnt: %s, by %s',
				taskId,
				results,
				signedInUserId
			);
			return results;
		} catch (err) {
			logger.debug('[TaskData].deleteMembers error: %o', err);
			throw err;
		}
	}

	static async insertMembers(
		taskId: number,
		members: TaskMemberModel[],
		signedInUserId: number,
		trx: Knex.Transaction
	) {
		const insertDate = new Date();
		const membersData = members.map(
			(x) =>
				<TaskMembersRow>{
					userId: x.userId,
					taskId,
					addedAt: insertDate,
					addedBy: signedInUserId,
					position: x.position,
				}
		);

		try {
			const results: number[] = await trx('taskMembers').insert(
				membersData,
				'userId'
			);

			logger.debug(
				'[TaskData].insertMembers taskId: %s, inserted cnt: %s, by: %s',
				taskId,
				results.length,
				signedInUserId
			);

			return results;
		} catch (err) {
			logger.debug('[TaskData].insertMembers error: %o', err);
			throw err;
		}
	}

	static async setMembers(
		taskId: number,
		members: TaskMemberModel[],
		signedInUserId: number
	) {
		try {
			await knex.transaction(async (trx) => {
				let debugResults: any;
				debugResults = await PeriodData.deletePeriods(
					taskId,
					signedInUserId,
					trx
				);

				debugResults = await this.deleteMembers(
					taskId,
					null,
					signedInUserId,
					trx
				);

				debugResults = await this.insertMembers(
					taskId,
					members,
					signedInUserId,
					trx
				);

				return debugResults;
			});
			logger.debug(
				'[TaskData].setMembers taskId: %s, by %s',
				taskId,
				signedInUserId
			);
		} catch (err) {
			logger.debug('[TaskData].setMembers error: %o', err);
			throw err;
		}
	}


	private static mapTaskDataToModel(row: TaskRow, members: number[] = []) {
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
			createAt: row.createAt,
		});
	}
}

export default TaskData;
