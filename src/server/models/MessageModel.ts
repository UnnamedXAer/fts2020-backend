class MessageModel {
	public id: number;
	public date: Date;
	public title: string;
	public message: string;
	public recipient: number;
	public sender: number;
	public sent: boolean;

	constructor(params: MessageModel = {} as MessageModel) {
		const { id, date, title, message, recipient, sender, sent } = params;

		this.id = id;
		this.date = date;
		this.title = title;
		this.message = message;
		this.recipient = recipient;
		this.sender = sender;
		this.sent = sent;
	}
}

class MessageDataModel {
	public title: string;
	public message: string;
	public recipient: number;
	public sender: number;
	constructor(params: MessageDataModel = {} as MessageDataModel) {
		const { title, message, recipient, sender } = params;

		this.title = title;
		this.message = message;
		this.recipient = recipient;
		this.sender = sender;
	}
}
