export default class TaskPeriodModel {
	id?: number;
	taskId?: number;
	startDate?: Date;
	endDate?: Date;
	assignedTo?: number;
	completedBy?: number;
	completedAt?: Date;

	constructor(params: TaskPeriodModel = {} as TaskPeriodModel) {
		const {
			id,
			taskId,
			startDate,
			endDate,
			assignedTo,
			completedBy,
			completedAt
		} = params;

		this.id = id;
		this.taskId = taskId;
		this.startDate = startDate;
		this.endDate = endDate;
		this.assignedTo = assignedTo;
		this.completedBy = completedBy;
		this.completedAt = completedAt;
	}
}
