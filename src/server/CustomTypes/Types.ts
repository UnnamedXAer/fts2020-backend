
export type Provider = 'local' | 'google';

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