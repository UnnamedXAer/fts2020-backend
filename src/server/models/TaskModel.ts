import { TaskPeriodUnit } from '../../constants/dbFields';

export default class TaskModel {
	id?: number;
	flatId?: number;
	title?: string;
	description?: string;
	startDate?: Date;
	endDate?: Date;
	timePeriodUnit?: TaskPeriodUnit;
	timePeriodValue?: number;
	active?: boolean;
	members?: number[];
	createBy?: number;
	createAt?: Date;

	constructor(params: TaskModel = {} as TaskModel) {
		const {
			id,
			flatId,
			title,
			description,
			startDate,
			endDate,
			timePeriodUnit,
			timePeriodValue,
			active,
			members,
			createBy,
			createAt
		} = params;

		this.id = id;
		this.flatId = flatId;
		this.title = title;
		this.description = description;
		this.startDate = startDate;
		this.endDate = endDate;
		this.timePeriodUnit = timePeriodUnit;
		this.timePeriodValue = timePeriodValue;
		this.active = active;
		this.members = members;
		this.createBy = createBy;
		this.createAt = createAt;
	}
}
