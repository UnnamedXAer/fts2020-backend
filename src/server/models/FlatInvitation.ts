import { FlatInvitationStatus } from '../customTypes/DbTypes';

export default class FlatInvitationModel {
	id?: number;
	flatId: number;
	emailAddress: string;
	sendDate?: Date;
	actionDate?: Date;
	status: FlatInvitationStatus;
	createBy: number;
	createAt: Date;
	token: string;

	constructor(prams: FlatInvitationModel = {} as FlatInvitationModel) {
		const {
			id,
			flatId,
			createBy,
			createAt,
			emailAddress,
			actionDate,
			sendDate,
			status,
			token
		} = prams;

		this.id = id;
		this.flatId = flatId;
		this.createBy = createBy;
		this.createAt = createAt;
		this.emailAddress = emailAddress;
		this.actionDate = actionDate;
		this.sendDate = sendDate;
		this.status = status;
		this.token = token;
	}
}
