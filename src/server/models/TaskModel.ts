export default class TaskModel {
	id?: number | undefined;
	flatId?: number;
	title?: string;
	description?: string;
	startDate?: Date;
	endDate?: Date;
	timePeriod?: number;
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
			timePeriod,
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
		this.timePeriod = timePeriod;
		this.active = active;
		this.members = members;
		this.createBy = createBy;
		this.createAt = createAt;
	}
}
