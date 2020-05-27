import moment from 'moment';
import FlatModel from '../models/FlatModel';
import UserModel from '../models/UserModel';
import FlatInvitationModel from '../models/FlatInvitation';
import FlatData from '../dataAccess/Flat/FlatData';
import UserData from '../dataAccess/User/UserData';
import FlatInvitationData from '../dataAccess/Flat/FlatInvitationData';
import logger from '../../logger';
import { sendMail } from './mail';
import { FlatInvitationStatus } from '../customTypes/DbTypes';

export const sendInvitationsToFlat = async (flatId: number) => {
	let flat: FlatModel | null;
	let owner: UserModel | null;
	let invitations: FlatInvitationModel[];

	try {
		flat = await FlatData.getById(flatId);
		if (!flat) {
			throw new Error(`Flat with id: ${flatId} do not exists.`);
		}
		owner = await UserData.getById(flat.createBy!)!;
		invitations = (await FlatInvitationData.getByFlat(flat.id!)).filter(
			(x) =>
				x.status === FlatInvitationStatus.NOT_SENT ||
				x.status === FlatInvitationStatus.SEND_ERROR
		);
	} catch (err) {
		logger.error(
			'[sendInvitationsToFlat] flatId %s, error: %o',
			flatId,
			err
		);
		return;
	}

	invitations!.forEach(async (inv) => {
		let sendSuccessfully: boolean = false;

		try {
			const recipient = await UserData.getByEmailAddress(
				inv.emailAddress
			);

			const { html, plainText } = getEmailInvitationContent(
				inv.id!,
				inv.emailAddress,
				flat!,
				owner!,
				recipient
			);
			await sendMail(
				inv.emailAddress,
				'FTS2020 Flat Invitation',
				html,
				plainText
			);
			sendSuccessfully = true;
			await FlatInvitationData.update(
				inv.id!,
				FlatInvitationStatus.PENDING
			);
			logger.debug(
				'[sendInvitationsToFlat] invitations: %s send.',
				inv.id
			);
		} catch (err) {
			if (!sendSuccessfully) {
				logger.error(
					'[sendInvitationsToFlat] fail to send invitation id: %s, error: %o',
					inv.id,
					err
				);
				try {
					await FlatInvitationData.update(
						inv.id!,
						FlatInvitationStatus.SEND_ERROR
					);
				} catch (err) {
					logger.error(
						'[sendInvitationsToFlat] failed to set "SEND_ERROR" status for inv id: %s, error: %o',
						inv.id,
						err
					);
				}
			} else {
				logger.error(
					'[sendInvitationsToFlat] failed to set "PENDING" status for inv id: %s, error: %o',
					inv.id,
					err
				);
			}
		}
	});
};

const getEmailInvitationContent = (
	invitationId: number,
	email: string,
	flat: FlatModel,
	owner: UserModel,
	recipient: UserModel | null
) => {
	const DOMAIN = `http://localhost:3021`;
	const unregisteredInfo = `If you are not a member of FTS2020 you can register.`;

	const html = `<div style="
		font-size: 1.1em;
		width: 90%; 
		max-width: 768px;
		min-width: 300px; 
		margin: auto; 
		font-family: sans-serif
	">
		<a href="https://fts2020/" target="blank">
			<h1 style="text-align: center; width: 100%; color: #009688;">FTS2020</h1>
		</a>
		<h2>Hello ${recipient && recipient.userName ? recipient.userName : email}</h2>

		<p>You have been invited by <strong>${
			owner.emailAddress
		} <span style="color: #888;"></span>(${
		owner.userName
	})</strong> to join a flat in <strong>FTS2020</strong> application.</p>
		<p>Click <a href="https://fts2020/invitation/12" target="blank" title="Open FTS2020 web page.">here</a>
			to
			view invitation and decide if <a href="https://fts2020/invitation/12/accept" target="blank"
				title="Accept and join to flat.">accept</a> or <a href="https://fts2020/invitation/12/decline"
				target="blank" title="Reject.">decline</a> it.</p>
		<p>${unregisteredInfo}</p>
		<p>If you are not yet member of <strong>FTS2020</strong> <a href="https://fts2020/invitation/12" target="blank"
				title="Open FTS2020 web page.">here</a> you can sign up.</p>
		<div style="
				margin: 34px 16px 24px 16px; 
				/* position: relative; */
				/* border: 1px solid #ccc;  */
				/* box-shadow: 0 2px 3px #eee;  */
				padding: 16px;
				padding: 4px 16px;
				border: 2px solid teal;
				box-shadow: 0 2px 3px teal;
				background-color: white;
			">
			<h2>${flat.name}</h2>
			<hr />
			<p style="color: #888;">Created by: ${owner.emailAddress} ${owner.userName}</p>
			<p style="color: #888;">Created at: ${moment(flat.createAt).format('LL')}</p>
			<hr />
			<p>${flat.description}</p>
		</div>
	</div>`;

	const plainText = `You have been invited by ${owner.emailAddress} (${owner.userName}) to join a flat in FTS2020 application.\
	Click link below to open FTS2020 webpage and decide if you want to accept or reject invitation.\
	${DOMAIN}/invitation/${invitationId}`;

	return { html, plainText };
};
