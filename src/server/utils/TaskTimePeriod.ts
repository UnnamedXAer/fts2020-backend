import { TaskPeriodUnit } from '../CustomTypes/TaskTypes';

export function findEndDate(
	unit: TaskPeriodUnit,
	value: number,
	startDate: Date
) {
	let endDate: Date | null;
	let offset = 0;
	switch (unit) {
		case TaskPeriodUnit.HOUR:
			offset = 1000 * 60 * 60 * value;
			endDate = new Date(startDate.getTime() + offset);
			break;
		case TaskPeriodUnit.DAY:
			offset = 1000 * 60 * 60 * 24 * value;
			endDate = new Date(startDate.getTime() + offset);
			break;
		case TaskPeriodUnit.WEEK:
			offset = 1000 * 60 * 60 * 24 * 7 * value;
			endDate = new Date(startDate.getTime() + offset);
			break;
		case TaskPeriodUnit.MONTH:
			offset = 1000 * 60 * 60 * 24 * 7 * value;
			endDate = null; //new Date(startDate.getTime() + offset);
			break;
		case TaskPeriodUnit.YEAR:
			const year = startDate.getFullYear();
			endDate = new Date(startDate);
			endDate.setFullYear(year + value);
			break;
		default:
			endDate = null;
			break;
	}
	return endDate;
}
