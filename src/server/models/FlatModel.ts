export default class FlatModel {
	id?: number;
	name?: string;
	description?: string;
	members?: number[];
	createBy?: number;
	createAt?: Date;

	constructor(prams: FlatModel = {} as FlatModel) {
		const { id, name, description, members, createBy, createAt } = prams;

		this.id = id;
		this.name = name;
		this.description = description;
		this.members = members;
		this.createBy = createBy;
		this.createAt = createAt;
	}
}
