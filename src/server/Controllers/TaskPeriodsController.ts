import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import HttpException from '../utils/HttpException';
import TaskModel from '../Models/TaskModel';
import TaskData from '../DataAccess/Task/TaskData';
import { loggedUserId } from '../utils/authUser';
import FlatData from '../DataAccess/Flat/FlatData';
import TaskPeriodModel from '../Models/TaskPeriodModel';
import { TaskMemberModel } from '../Models/TaskMemberModel';
import { TaskPeriodUnit } from '../CustomTypes/TaskTypes';
import { findEndDate } from '../utils/TaskTimePeriod';

export const generatePeriods: RequestHandler = async (req, res, next) => {
	const _taskId = req.params['id'];
	let task: TaskModel | null;
	const signedInUserId = loggedUserId(req);

	const taskId = parseInt(_taskId, 10);
	if (+_taskId !== taskId) {
		return next(
			new HttpException(HttpStatus.NOT_ACCEPTABLE, 'Invalid param.')
		);
	}

	try {
		task = await TaskData.getById(taskId);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}

	if (
		!task ||
		task.createBy !== signedInUserId ||
		!(await FlatData.isUserFlatOwner(signedInUserId, task.flatId!))
	) {
		return next(
			new HttpException(
				HttpStatus.UNAUTHORIZED,
				'Unauthorized access - You do not have permissions to maintain this task.'
			)
		);
	}

	// generate periods
	const taskPeriods: TaskPeriodModel[] = [];
	const taskMembers = task.members;
	if (!taskMembers || taskMembers.length === 0) {
		return res.status(200).json('No members assigned to task.');
	}

	taskMembers.sort((a,b) => a.position! - b.position!);

	const membersLen = taskMembers.length;
	let startDate = <Date>task.startDate;
	const endDate = <Date>task.endDate;
	const periodUnit = <TaskPeriodUnit>task.timePeriodUnit;
	const periodValue = <number>task.timePeriodValue;
	let membersIndex = 0;
	for(let i =0; i< 30; i++) {
		if (membersIndex === membersLen) {
			membersIndex = 0;
		}
		const assignTo = taskMembers[membersIndex++].userId;
		let currentEndDate = findEndDate(periodUnit, periodValue, startDate);
		if (!currentEndDate) {
			break;
		}


		const period = new TaskPeriodModel({
			assignedTo: assignTo,
			// startDate: startDate
		});
		taskPeriods.push(period);
	}

	try {
		const createdTimePeriods = await TaskData.addTaskPeriods(taskPeriods);

		res.status(HttpStatus.CREATED).json(createdTimePeriods);
	} catch (err) {
		return next(new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, err));
	}
};
