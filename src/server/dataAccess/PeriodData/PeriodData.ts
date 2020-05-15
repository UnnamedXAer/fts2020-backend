import knex from '../../../db';
import logger from '../../../logger';
import { TaskPeriodsRow, TaskPeriodsFullRow } from '../../customTypes/DbTypes';
import TaskPeriodModel, {
	TaskPeriodFullModel,
	TaskPeriodUserModel,
} from '../../models/TaskPeriodModel';

class PeriodData {
	private static periodFullRow = [
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
	];

	static async getById(id: number) {
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
				'[PeriodData].getPeriodById task period for id: %s is: %o',
				id,
				taskPeriod
			);
			return taskPeriod;
		} catch (err) {
			logger.debug('[PeriodData].getPeriodById error: %o', err);
			throw err;
		}
	}

	static async getFullModelById(id: number) {
		try {
			const results = await knex
				.select(this.periodFullRow)
				.from('taskPeriods as tp')
				.join('appUser as asg', { 'asg.id': 'tp.assignedTo' })
				.leftJoin('appUser as cb', {
					'cb.id': 'tp.completedBy',
				})
				.where({'tp.id': id});

			const period = results[0] ? this.mapPeriodFullRowDataToModel(results[0]) : null;

			logger.debug(
				'[PeriodData].getFullModelById %s is: %o',
				id,
				period
			);
			return period;
		} catch (err) {
			logger.debug('[PeriodData].getFullModelById error: %o', err);
			throw err;
		}
	}

	static async getFullModelByTaskId(taskId: number) {
		try {
			const results = await knex
				.select(this.periodFullRow)
				.from('taskPeriods as tp')
				.join('appUser as asg', { 'asg.id': 'tp.assignedTo' })
				.leftJoin('appUser as cb', {
					'cb.id': 'tp.completedBy',
				})
				.where({ taskId }).orderBy('tp.startDate');

			const taskPeriods = results.map(this.mapPeriodFullRowDataToModel);

			logger.debug(
				'[PeriodData].getPeriodsByTaskId number of periods for task %s is %s',
				taskId,
				taskPeriods.length
			);
			return taskPeriods;
		} catch (err) {
			logger.debug('[PeriodData].getPeriodsByTaskId error: %o', err);
			throw err;
		}
	}

	static async updatePeriod(period: TaskPeriodModel) {
		const updateDate = new Date();

		const updateData: TaskPeriodsRow = {
			assignedTo: period.assignedTo,
			completedAt: period.completedBy ? updateDate : void 0,
			completedBy: period.completedBy,
		};

		try {
			await knex('taskPeriods')
				.update(updateData)
				.where({ id: period.id });

			const taskPeriod = await this.getFullModelById(period.id!);

			logger.debug(
				'[PeriodData].updatePeriod updated period: %o',
				taskPeriod
			);

			return taskPeriod;
		} catch (err) {
			logger.debug('[PeriodData].updatePeriod error: %o', err);
			throw err;
		}
	}

	private static mapPeriodFullRowDataToModel(
		row: TaskPeriodsFullRow
	): TaskPeriodFullModel {
		const period = new TaskPeriodFullModel({
			id: row.id,
			taskId: row.taskId,
			assignedTo: new TaskPeriodUserModel({
				emailAddress: row.asgEmail,
				userName: row.asgName,
			}),
			startDate: row.startDate,
			endDate: row.endDate,
			completedAt: row.completedAt ? row.completedAt : null,
			completedBy: row.cbEmail
				? new TaskPeriodUserModel({
						emailAddress: row.cbEmail,
						userName: row.cbName!,
				  })
				: null,
		});

		return period;
	}
}

export default PeriodData;
