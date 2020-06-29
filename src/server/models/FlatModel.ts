export default class FlatModel {
	id?: number;
	name?: string;
	description?: string;
	members?: number[];
	createBy?: number;
	createAt?: Date;
	active?: boolean;

	constructor(prams: FlatModel = {} as FlatModel) {
		const {
			id,
			name,
			description,
			members,
			createBy,
			createAt,
			active,
		} = prams;

		this.id = id;
		this.name = name;
		this.description = description;
		this.members = members;
		this.createBy = createBy;
		this.createAt = createAt;
		this.active = active;
	}
}
