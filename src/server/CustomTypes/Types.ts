
export type Provider = 'local' | 'google';

export interface UserRow {
    id?: number;
    emailAddress: string;
    userName: string;
	password?: string;
	provider: Provider;
	joinDate: Date;
	avatarUrl?: string;
	active: boolean
}