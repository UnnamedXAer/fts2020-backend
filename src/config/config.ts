export const SESSION_DURATION = 1000 * 60 * 60 * 24;

export enum FlatInvitationStatus {
	'NOT_SENT' = 'NOT_SENT',
	'SEND_ERROR' = 'SEND_ERROR',
	'PENDING' = 'PENDING',
	'ACCEPTED' = 'ACCEPTED',
	'REJECTED' = 'REJECTED',
	'EXPIRED' = 'EXPIRED',
	'CANCELED' = 'CANCELED',
}
