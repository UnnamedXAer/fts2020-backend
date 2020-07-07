import logger from '../../../logger';
import knex from '../../../db';
import { MessageRow } from '../../customTypes/DbTypes';

class MessageData {
	static async create(message: MessageDataModel, loggedUserId: number) {
		const currentDate = new Date();

		const data = {
			createAt: currentDate,
			createBy: loggedUserId,
			recipient: message.recipient,
			sent: false,
			subject: message.title,
			content: message.message,
		} as Partial<MessageRow>;

		try {
			const results = await knex<MessageRow>('message').insert(data, '*');
			const createdMessage = mapMessageDataToModel(results[0]);

			logger.debug('[MessageData].create message: %o', createdMessage);
			return createdMessage;
		} catch (err) {
			logger.debug('[MessageData].create error: %o', err);
			throw err;
		}
	}
}

const mapMessageDataToModel = (data: MessageRow) =>
	new MessageModel({
		id: data.id,
		date: data.createAt,
		sender: data.createBy,
		recipient: data.recipient,
		title: data.subject,
		message: data.content,
		sent: data.sent,
	});

export default MessageData;
