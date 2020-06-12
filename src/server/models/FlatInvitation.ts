import { FlatInvitationStatus } from '../customTypes/DbTypes';
import UserModel from './UserModel';
import FlatModel from './FlatModel';

export default class FlatInvitationModel {
	id?: number;
	flatId: number;
	emailAddress: string;
	sendDate: Date | null;
	actionDate?: Date;
	status: FlatInvitationStatus;
	createBy: number;
	createAt: Date;
	token: string;
	actionBy: number | null;

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
			token,
			actionBy,
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
		this.actionBy = actionBy;
	}
}

export class FlatInvitationPresentationModel {
	public id: number;
	public token: string;
	public status: FlatInvitationStatus;
	public sendDate: Date | null;
	public actionDate: Date;
	public createAt: Date;
	public sender: UserModel;
	public invitedPerson: UserModel | string;
	public flat: FlatModel;
	public flatOwner: UserModel;
	public actionBy: UserModel | null;

	constructor(
		params: FlatInvitationPresentationModel = {} as FlatInvitationPresentationModel
	) {
		const {
			id,
			token,
			status,
			sendDate,
			actionDate,
			createAt,
			sender,
			invitedPerson,
			flat,
			flatOwner,
			actionBy,
		} = params;

		this.id = id;
		this.token = token;
		this.status = status;
		this.sendDate = sendDate;
		this.actionDate = actionDate;
		this.createAt = createAt;
		this.sender = sender;
		this.invitedPerson = invitedPerson;
		this.flat = flat;
		this.flatOwner = flatOwner;
		this.actionBy = actionBy;
	}
}
