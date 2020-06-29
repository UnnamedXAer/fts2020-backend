import knex from '../../../db';
import logger from '../../../logger';
import { TaskPeriodsRow, TaskPeriodsFullRow } from '../../customTypes/DbTypes';
import TaskPeriodModel, {
	TaskPeriodFullModel,
	TaskPeriodUserModel,
	TaskPeriodCurrentModel,
} from '../../models/TaskPeriodModel';
import moment from 'moment';
import TaskData from '../Task/TaskData';
import { updateDates } from '../../utils/TaskTimePeriod';

class PeriodData {
	private static periodFullModelSQL = `select "tp"."id",
		"tp"."taskId",
		date_trunc('day', "tp"."startDate") as "startDate",
		date_trunc('day', "tp"."endDate") as "endDate", 
		"tp"."completedAt",
		"asg"."emailAddress" as "asgEmail",
		"asg"."userName" as "asgName",
		"asg"."id" as "asgId",
		"cb"."emailAddress" as "cbEmail",
		"cb"."userName" as "cbName",
		"cb"."id" as "cbId" 
		from "taskPeriods" as "tp" 
		inner join "appUser" as "asg" on "asg"."id" = "tp"."assignedTo" 
		left join "appUser" as "cb" on "cb"."id" = "tp"."completedBy" `;

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
			const results = await knex.raw(
				this.periodFullModelSQL + ` where tp.id = ?`,
				id
			);

			const period =
				results.rows && results.rows[0]
					? this.mapPeriodFullRowDataToModel(results[0])
					: null;

			logger.debug('[PeriodData].getFullModelById %s is: %o', id, period);
			return period;
		} catch (err) {
			logger.debug('[PeriodData].getFullModelById error: %o', err);
			throw err;
		}
	}
	static async getUserCurrent(userId: number) {
		const currentDateMidnight = moment().startOf('day').toDate();
		try {
			const results = await knex
				.select<TaskPeriodCurrentModel[]>([
					{ id: 'tp.id' },
					{ taskId: 't.id' },
					{ startDate: 'tp.startDate' },
					{ endDate: 'tp.endDate' },
					{ taskName: 't.title' },
				])
				.from('taskPeriods as tp')
				.join('task as t', { 't.id': 'tp.taskId' })
				.whereNull('tp.completedBy')
				.andWhere({ 'tp.assignedTo': userId })
				.andWhereRaw(
					'date(?) BETWEEN date("tp"."startDate") and date("tp"."endDate")',
					[currentDateMidnight]
				)
				.orderByRaw(
					'date("tp"."endDate"), date("tp"."startDate") desc'
				);

			const periods = results.map(
				(period) =>
					new TaskPeriodCurrentModel({
						...period,
					})
			);

			logger.debug(
				'[PeriodData].getUserCurrent userId: %s, results count %s',
				userId,
				periods.length
			);
			return periods;
		} catch (err) {
			logger.debug('[PeriodData].getUserCurrent error: %o', err);
			throw err;
		}
	}

	static async getFullModelByTaskId(taskId: number) {
		try {
			const results = await knex.raw(
				this.periodFullModelSQL +
					` where "taskId" = ? order by "tp"."startDate"`,
				taskId
			);

			const taskPeriods = results.rows
				? results.rows.map(this.mapPeriodFullRowDataToModel)
				: [];

			logger.debug(
				'[PeriodData].getFullModelByTaskId task Id: %s, periods count: %s',
				taskId,
				taskPeriods.length
			);
			return taskPeriods;
		} catch (err) {
			logger.debug('[PeriodData].getFullModelByTaskId error: %o', err);
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

	static async resetPeriods(
		taskId: number
	): Promise<
		{ info: 'no-members' } | { info: 'ok'; periods: TaskPeriodFullModel[] }
	> {
		const currentDate = new Date();
		const startOfCurrentDate = moment(currentDate).startOf('day').toDate();

		try {
			const delResults = await knex('taskPeriods')
				.del()
				.where({
					taskId,
				})
				.whereNull('completedBy')
				.andWhereRaw('date("endDate") > ? ', startOfCurrentDate);

			logger.debug(
				'[PeriodData].resetPeriods taskId %s, deleted periods cnt: %s',
				taskId,
				delResults
			);

			const periodsResults = await this.generatePeriods(taskId);

			if (periodsResults.info === 'no-members') {
				return periodsResults;
			}

			const createdPeriods = await TaskData.addPeriods(
				periodsResults.periods,
				taskId
			);

			logger.debug('[PeriodData].resetPeriods taskId %s', taskId);

			return { info: 'ok', periods: createdPeriods };
		} catch (err) {
			logger.debug('[PeriodData].resetPeriods error: %o', err);
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

	private static async generatePeriods(
		taskId: number
	): Promise<
		{ info: 'no-members' } | { info: 'ok'; periods: TaskPeriodModel[] }
	> {
		const task = await TaskData.getById(taskId);
		if (!task) {
			throw new Error(`Task with Id: ${taskId} does not exist.`);
		}

		const taskMembers = task.members!;
		const membersLen = taskMembers.length;
		if (membersLen === 0) {
			return {
				info: 'no-members',
			};
		}

		const lastDatePeriodsResults = await knex('taskPeriods')
			.max('endDate')
			.where({ taskId });

		let startDate =
			lastDatePeriodsResults[0].max !== null
				? moment(lastDatePeriodsResults[0].max).add(1, 'day').toDate()
				: task.startDate!;
		const endDate = task.endDate!;
		const periodUnit = task.timePeriodUnit!;
		const periodValue = task.timePeriodValue!;
		let membersIndex = 0;

		const taskPeriods: TaskPeriodModel[] = [];
		for (let i = 0; i < 30; i++) {
			if (membersIndex === membersLen) {
				membersIndex = 0;
			}
			const assignTo = taskMembers[membersIndex++];
			const { currentStartDate, currentEndDate } = updateDates(
				periodUnit,
				periodValue,
				startDate,
				i
			);

			const period = new TaskPeriodModel({
				assignedTo: assignTo,
				startDate: currentStartDate,
				endDate: currentEndDate,
				taskId: taskId,
			});
			taskPeriods.push(period);

			startDate = currentEndDate;

			if (currentEndDate >= endDate) {
				break;
			}
		}

		return { info: 'ok', periods: taskPeriods };
	}
}

export default PeriodData;
