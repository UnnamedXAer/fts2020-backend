import { TaskPeriodUnit } from '../customTypes/TaskTypes';

export function updateDates(
	unit: TaskPeriodUnit,
	value: number,
	startDate: Date,
	index: number
) {
	// let offset = 0;

	switch (unit) {
		// case TaskPeriodUnit.HOUR:
		// 	offset = 1000 * 60 * 60 * value;
		// 	// endDate = new Date(startDate.getTime() + offset);
		// 	break;
		case TaskPeriodUnit.DAY:
			return calculateNextDatesForDay(startDate, value, index);
		case TaskPeriodUnit.WEEK:
			return calculateNextDatesForWeek(startDate, value, index);
		// case TaskPeriodUnit.MONTH:
		// 	// endDate = new Date(
		// 	// 	new Date(startDate).setMonth(startDate.getMonth() + value)
		// 	// );
		// 	break;
		// case TaskPeriodUnit.YEAR:
		// 	// const year = startDate.getFullYear();
		// 	// endDate = new Date(startDate);
		// 	// endDate.setFullYear(year + value);
		// 	break;
	}
	throw new Error('something is not setup correctly');
}

function calculateNextDatesForWeek(
	startDate: Date,
	value: number,
	index: number
) {
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

function calculateNextDatesForDay(
	startDate: Date,
	value: number,
	index: number
) {
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
