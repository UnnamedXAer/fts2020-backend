export default class FlatModel {
	id?: number;
	name?: string;
	address?: string;
	members?: number[]
	createBy?: number;
	createAt?: Date;

	constructor(prams: FlatModel = {} as FlatModel) {
		const { id, name, address, members, createBy, createAt } = prams;

		this.id = id;
		this.name = name;
		this.address = address;
		this.members = members;
		this.createBy = createBy;
		this.createAt = createAt;
	}
}
