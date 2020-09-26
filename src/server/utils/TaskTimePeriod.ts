import moment from 'moment';
import { TaskPeriodUnit } from '../customTypes/TaskTypes';

export function updateDates(
	unit: TaskPeriodUnit,
	value: number,
	startDate: Date,
	index: number
) {
	switch (unit) {
		case TaskPeriodUnit.DAY:
			return calculateNextDatesForDay(startDate, value, index);
		case TaskPeriodUnit.WEEK:
			return calculateNextDatesForWeek(startDate, value, index);
		case TaskPeriodUnit.MONTH:
			return calculateNextDatesForMonth(startDate, value, index);
		default:
			throw new Error(`Unsupported task period unit "${unit}".`);
	}
}

function calculateNextDatesForMonth(startDate: Date, value: number, index: number) {
	const currentStartDate = moment(startDate)
		.add(index > 0 ? 1 : 0, 'day')
		.toDate();
	const currentEndDate = moment(currentStartDate).add(value, 'month').toDate();
	return {
		currentStartDate,
		currentEndDate,
	};
}

function calculateNextDatesForWeek(startDate: Date, value: number, index: number) {
	const dayInMs = 1000 * 60 * 60 * 24;
	const startDateOffset = dayInMs * (index > 0 ? 1 : 0);
	let endDateOffset: number;
	if (value === 1) {
		endDateOffset = dayInMs * 6 * value;
	} else {
		endDateOffset = dayInMs * 7 * value - dayInMs;
	}

	const currentStartDate = new Date(startDate.getTime() + startDateOffset);
	const currentEndDate = new Date(currentStartDate.getTime() + endDateOffset);

	return {
		currentStartDate,
		currentEndDate,
	};
}

function calculateNextDatesForDay(startDate: Date, value: number, index: number) {
	const dayInMs = 1000 * 60 * 60 * 24;

	const startDateOffset = dayInMs * (index > 0 ? 1 : 0);
	let endDateOffset: number;
	endDateOffset = dayInMs * (value - 1);

	const currentStartDate = new Date(startDate.getTime() + startDateOffset);
	const currentEndDate = new Date(currentStartDate.getTime() + endDateOffset);

	return {
		currentStartDate,
		currentEndDate,
	};
}
