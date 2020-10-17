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

export enum TaskPeriodUnit {
	'HOUR' = 'HOUR',
	'DAY' = 'DAY',
	'WEEK' = 'WEEK',
	'MONTH' = 'MONTH',
	'YEAR' = 'YEAR'
}

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
