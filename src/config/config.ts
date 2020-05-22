export const SESSION_DURATION = 1000 * 60 * 60 * 24;
export enum FlatInvitationStatus {
	'NOT_SEND' = 'NOT_SEND',
	'PENDING' = 'PENDING',
	'ACCEPTED' = 'ACCEPTED',
	'REJECTED' = 'REJECTED',
	'EXPIRED' = 'EXPIRED',
	'CANCELED' = 'CANCELED',
}