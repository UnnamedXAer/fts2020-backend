import knex from '../../../db';
import logger from '../../../logger';
import {
	TaskRow,
	TaskMembersRow,
	TaskPeriodsRow,
	UserRow,
} from '../../customTypes/DbTypes';
import TaskModel from '../../models/TaskModel';
import { TaskMemberModel } from '../../models/TaskMemberModel';
import TaskPeriodModel, {
	TaskPeriodFullModel,
} from '../../models/TaskPeriodModel';
import UserModel from '../../models/UserModel';
import UserTaskModel from '../../models/UserTaskModel';

class TaskData {
	static async getAll() {
		try {
			const results: TaskRow[] = await knex('task').select('*');

			const tasks = [];
			for (let i = 0; i < results.length; i++) {
				const taskRow = results[i];
				const membersResults = (await this.getMembers(taskRow.id)).map(
					(x) => x.id
				);
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
				const membersResults = (await this.getMembers(id)).map(
					(x) => x.id
				);
				task = this.mapTaskDataToModel(results[0], membersResults);
			}

			logger.debug('[TaskData].getById given id: %s, Task: %o', id, task);
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
				logger.silly(
					'[TaskData].getByFlatId FlatId: %s, Task: %o',
					task
				);
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

				logger.silly(
					'[TaskData].getByUser userId: %s, Task: %o',
					id,
					task
				);
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
			const results: UserRow[] = await knex<UserRow[]>('taskMembers')
				.join('appUser', 'appUser.id', '=', 'userId')
				.select('appUser.*')
				.where({ taskId });

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
				'[TaskData].getMembers members count for task: %s is: %s',
				taskId,
				members.length
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
				(x) =>
					<TaskMembersRow>{
						userId: x.userId,
						taskId,
						addedAt: insertDate,
						addedBy: signedInUserId,
						position: x.position,
					}
			);

			await knex('taskMembers').delete().where({ taskId });

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
				'[TaskData].setMembers current members for: %s are: %o',
				taskId,
				addedMembers
			);

			return addedMembers;
		} catch (err) {
			logger.debug('[TaskData].setMembers error: %o', err);
			throw err;
		}
	}

	static async getTaskPeriodById(id: number) {
		try {
			const results: TaskPeriodsRow[] = await knex('taskPeriods')
				.select('*')
				.where({ id });

			const row = results[0];
			const taskPeriod = row
				? new TaskPeriodModel({
						id: row.id,
						taskId: row.taskId,
						assignedTo: row.assignedTo,
						startDate: row.startDate,
						endDate: row.endDate,
						completedAt: row.completedAt,
						completedBy: row.completedBy,
				  })
				: null;

			logger.debug(
				'[TaskData].getTaskPeriodById task period for id: %s is: %o',
				id,
				taskPeriod
			);
			return taskPeriod;
		} catch (err) {
			logger.debug('[TaskData].getTaskPeriodById error: %o', err);
			throw err;
		}
	}

	static async addTaskPeriods(
		taskPeriods: TaskPeriodModel[],
		taskId: number
	): Promise<TaskPeriodFullModel[]> {
		const periodsData = taskPeriods.map((x) => {
			return <TaskPeriodsRow>{
				taskId: taskId,
				assignedTo: x.assignedTo,
				startDate: x.startDate,
				endDate: x.endDate,
			};
		});

		try {
			const results = await knex('taskPeriods').insert(periodsData);

			const currentTaskPeriods = this.getTaskPeriodsByTaskId(taskId);

			logger.debug(
				'[TaskData].addTaskPeriods  %s periods was created for task (%s) ',
				taskId,
				results
			);
			return currentTaskPeriods;
		} catch (err) {
			logger.debug('[TaskData].addTaskPeriods error: %o', err);
			throw err;
		}
	}

	static async getTaskPeriodsByTaskId(taskId: number) {
		try {
			const results = await knex
				.select([
					'tp.id',
					'tp.taskId',
					'tp.startDate',
					'tp.endDate',
					'tp.completedAt',
					{ asgEmail: 'asg.emailAddress' },
					{ asgName: 'asg.userName' },
					{ asgId: 'asg.id' },
					{ cbEmail: 'cb.emailAddress' },
					{ cbName: 'cb.userName' },
					{ cbId: 'cb.id' },
				])
				.from('taskPeriods as tp')
				.join('appUser as asg', { 'asg.id': 'tp.assignedTo' })
				.leftJoin('appUser as cb', {
					'cb.id': 'tp.completedBy',
				})
				.where({ taskId });

			const taskPeriods = results.map(
				(x) =>
					new TaskPeriodFullModel({
						id: x.id,
						taskId: x.taskId,
						assignedTo: {
							emailAddress: x.asgEmail,
							userName: x.asgName,
						},
						startDate: x.startDate,
						endDate: x.endDate,
						completedAt: x.completedAt ? x.completedAt : null,
						completedBy: x.cbEmail
							? {
									emailAddress: x.cbEmail,
									userName: x.cbName,
							  }
							: null,
					})
			);

			logger.debug(
				'[TaskData].getTaskPeriods number of periods for task %s is %s',
				taskId,
				taskPeriods.length
			);
			return taskPeriods;
		} catch (err) {
			logger.debug('[TaskData].getTaskPeriods error: %o', err);
			throw err;
		}
	}

	static async updateTaskPeriod(period: TaskPeriodModel) {
		const updateDate = new Date();

		const updateData: TaskPeriodsRow = {
			assignedTo: period.assignedTo,
			completedAt: period.completedBy ? updateDate : void 0,
			completedBy: period.completedBy,
		};

		try {
			const results: TaskPeriodsRow[] = await knex('taskPeriods')
				.update(updateData)
				.where({ id: period.id })
				.returning('*');

			const row = results[0];
			const taskPeriod = new TaskPeriodModel({
				id: row.id,
				taskId: row.taskId,
				assignedTo: row.assignedTo,
				startDate: row.startDate,
				endDate: row.endDate,
				completedAt: row.completedAt,
				completedBy: row.completedBy,
			});

			logger.debug(
				'[TaskData].updatedTaskPeriod updated period: %o',
				taskPeriod
			);

			return taskPeriod;
		} catch (err) {
			logger.debug('[TaskData].completeTaskPeriod error: %o', err);
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
