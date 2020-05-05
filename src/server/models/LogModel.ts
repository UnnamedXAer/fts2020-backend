export default class LogModel {
	public id: number | undefined;
	public txt: string = '';
	public createAt: Date = new Date();
	public createBy: number | undefined;
	public source: string | undefined;
	constructor(text: string, createAt: Date = new Date(), createBy?: number, source?: string, id?: number) {
		this.txt = text;
		this.createAt = createAt;
		this.createBy = createBy;
		this.source = source;
		this.id = id;
	}
}
