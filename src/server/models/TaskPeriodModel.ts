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
			completedAt,
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

export class TaskPeriodUserModel {
	emailAddress: string;
	userName: string;

	constructor(params: TaskPeriodUserModel = {} as TaskPeriodUserModel) {
		this.emailAddress = params.emailAddress;
		this.userName = params.userName;
	}
}

export class TaskPeriodFullModel {
	id: number;
	taskId: number;
	startDate: Date;
	endDate: Date;
	assignedTo: TaskPeriodUserModel;
	completedBy: TaskPeriodUserModel | null;
	completedAt: Date | null;

	constructor(params: TaskPeriodFullModel = {} as TaskPeriodFullModel) {
		const {
			id,
			taskId,
			startDate,
			endDate,
			assignedTo,
			completedBy,
			completedAt,
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
