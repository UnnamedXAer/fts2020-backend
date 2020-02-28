export class TaskMemberModel {
	id?: number;
	taskId?: number;
	userId?: number;
	position?: number;
	addedAt?: Date;
	addedBy?: number;

	constructor(params: TaskMemberModel = {} as TaskMemberModel) {
		const { id, taskId, userId, position, addedAt, addedBy } = params;
		this.id = id;
		this.taskId = taskId;
		this.userId = userId;
		this.position = position;
		this.addedAt = addedAt;
		this.addedBy = addedBy;
	}
}
