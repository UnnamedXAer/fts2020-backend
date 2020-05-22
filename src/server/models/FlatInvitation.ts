import { FlatInvitationStatus } from '../../config/config';

export default class FlatInvitationModel {
	id?: number;
	flatId: number;
	emailAddress: string;
	sendDate?: Date;
	actionDate?: Date;
	status: FlatInvitationStatus;
	createBy: number;
	createAt: Date;

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
		} = prams;

		this.id = id;
		this.flatId = flatId;
		this.createBy = createBy;
		this.createAt = createAt;
		this.emailAddress = emailAddress;
		this.actionDate = actionDate;
		this.sendDate = sendDate;
		this.status = status;
	}
}
