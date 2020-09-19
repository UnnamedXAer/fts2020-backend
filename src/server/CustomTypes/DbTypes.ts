import { TaskPeriodUnit } from './TaskTypes';

export enum FlatInvitationActions {
	'ACCEPT' = 'ACCEPT',
	'REJECT' = 'REJECT',
	'CANCEL' = 'CANCEL',
	'RESEND' = 'RESEND',
}

export enum FlatInvitationStatus {
	'CREATED' = 'CREATED',
	'SEND_ERROR' = 'SEND_ERROR',
	'PENDING' = 'PENDING',
	'ACCEPTED' = 'ACCEPTED',
	'REJECTED' = 'REJECTED',
	'EXPIRED' = 'EXPIRED',
	'CANCELED' = 'CANCELED',
}

export type Provider = 'local' | 'google' | 'github';

export const db = {
	CommonCols: {
		user: [
			'id',
			'emailAddress',
			'userName',
			'provider',
			'joinDate',
			'lastModDate',
			'avatarUrl',
			'active',
		],
		flatInvitation: [
			'id',
			'emailAddress',
			'flatId',
			'sendDate',
			'actionDate',
			'status',
			'createAt',
			'createBy',
			'token',
			'actionBy',
		],
		flatMembers: ['id', 'flatId', 'userId', 'addedBy', 'addedAt'],
	},
};

export interface UserRow {
	id?: number;
	emailAddress: string;
	userName: string;
	password?: string;
	provider: Provider;
	joinDate: Date;
	lastModDate?: Date;
	avatarUrl?: string;
	active: boolean;
}

export interface LogRow {
	id: number;
	txt: string;
	createAt: Date;
	createBy: number;
	source: string;
}

export interface TaskRow {
	id: number;
	flatId: number;
	title: string;
	description: string;
	startDate: Date;
	endDate: Date;
	timePeriodUnit: TaskPeriodUnit;
	timePeriodValue: number;
	active: boolean;
	createBy: number;
	createAt: Date;
	lastModBy: number;
	lastModAt: Date;
}

export interface FlatRow {
	id: number;
	name: string;
	description: string;
	createBy: number;
	createAt: Date;
	lastModBy: number;
	lastModAt: Date;
	active: boolean;
}

export interface FlatInvitationRow {
	id?: number;
	flatId: number;
	emailAddress: string;
	createBy: number;
	createAt: Date;
	sendDate: Date | null;
	actionDate: Date;
	status: FlatInvitationStatus;
	token: string;
	actionBy: number | null;
}

export interface FlatMembersRow {
	id?: number;
	flatId: number;
	userId: number;
	addedAt: Date;
	addedBy: number;
}

export type MembersForFlatRow = {
	userId: number;
};

export interface TaskMembersRow {
	id?: number;
	taskId: number;
	userId: number;
	position: number;
	addedAt: Date;
	addedBy: number;
}

export interface TaskPeriodsRow {
	id?: number;
	taskId?: number;
	startDate?: Date;
	endDate?: Date;
	assignedTo?: number;
	completedBy?: number;
	completedAt?: Date;
}

export type TaskPeriodsFullRow = {
	id: number;
	taskId: number;
	startDate: Date;
	endDate: Date;
	asgEmail: string;
	asgName: string;
	asgId: number;
	completedAt: Date | null;
	cbEmail: string | null;
	cbName: string | null;
	cbId: number | null;
};
