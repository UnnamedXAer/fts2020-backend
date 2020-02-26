import { TaskPeriodUnit } from './TaskTypes';

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

export interface TaskTimePeriod {
	id: number;
	taskId: number;
	unit: TaskPeriodUnit;
	value: number;
}

export interface FlatRow {
	id: number;
	name: string;
	address: string;
	createBy: number;
	createAt: Date;
	lastModBy: number;
	lastModAt: Date;
}

export interface FlatMemberRow {
	id?: number;
	flatId: number;
	userId: number;
	addedAt: Date;
	addedBy: number;
}

export interface TaskMembersRow {
	id?: number;
	flatId: number;
	userId: number;
	position: number;
	addedAt: Date;
	addedBy: number;
}

export interface TaskPeriodsRow {
	id: number;
	taskId: number;
	startDate: Date;
	endDate: Date;
	assignedTo: number;
	completedBy: number | undefined;
	completedAt: Date | undefined;
}
