import { TaskPeriodUnit } from '../customTypes/TaskTypes';

export default class UserTaskModel {
	id?: number;
	flatId?: number;
	title?: string;
	flatName?: string;
	timePeriodUnit?: TaskPeriodUnit;
	timePeriodValue?: number;
	active?: boolean;

	constructor(params: UserTaskModel = {} as UserTaskModel) {
		const {
			id,
			flatId,
			title,
			flatName,
			timePeriodUnit,
			timePeriodValue,
			active,
		} = params;

		this.id = id;
		this.flatId = flatId;
		this.title = title;
		this.flatName = flatName;
		this.timePeriodUnit = timePeriodUnit;
		this.timePeriodValue = timePeriodValue;
		this.active = active;
	}
}
