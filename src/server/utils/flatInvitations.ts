import moment from 'moment';
import Mail from 'nodemailer/lib/mailer';
import path from 'path';
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
		const allInvitations = await FlatInvitationData.getByFlat(flat.id!);
		invitations = allInvitations.filter(
			(x) =>
				x.status === FlatInvitationStatus.CREATED ||
				x.status === FlatInvitationStatus.SEND_ERROR
		);
	} catch (err) {
		logger.error('[sendInvitationsToFlat] flatId %s, error: %o', flatId, err);
		return;
	}

	invitations!.forEach(async (inv) => {
		await sendFlatInvitation(inv, flat!, owner!);
	});
};

export const sendFlatInvitation = async (
	inv: FlatInvitationModel,
	flat: FlatModel,
	owner: UserModel
) => {
	let sendSuccessfully: boolean = false;
	let updatedInvitation: FlatInvitationModel | null = null;

	try {
		const recipient = await UserData.getByEmailAddress(inv.emailAddress);

		const { html, plainText, attachments } = getEmailInvitationContent(
			inv.token,
			inv.emailAddress,
			flat!,
			owner!,
			recipient
		);

		await sendMail({
			to: inv.emailAddress,
			subject: 'FTS2020 Flat Invitation',
			html,
			text: plainText,
			attachments: attachments,
		});
		sendSuccessfully = true;
		updatedInvitation = await FlatInvitationData.update(
			inv.id!,
			FlatInvitationStatus.PENDING,
			inv.createBy
		);
		logger.debug('[sendFlatInvitation] invitations: %s sent.', inv.id);
	} catch (err) {
		if (!sendSuccessfully) {
			logger.error(
				'[sendFlatInvitation] fail to send invitation id: %s, error: %o',
				inv.id,
				err
			);
			try {
				updatedInvitation = await FlatInvitationData.update(
					inv.id!,
					FlatInvitationStatus.SEND_ERROR,
					inv.createBy
				);
			} catch (err) {
				logger.error(
					'[sendFlatInvitation] failed to set "SEND_ERROR" status for inv id: %s, error: %o',
					inv.id,
					err
				);
			}
		} else {
			logger.error(
				'[sendFlatInvitation] failed to set "PENDING" status for inv id: %s, error: %o',
				inv.id,
				err
			);
		}
	}

	return updatedInvitation;
};

const getEmailInvitationContent = (
	token: string,
	email: string,
	flat: FlatModel,
	owner: UserModel,
	recipient: UserModel | null
) => {
	const WEB_URL = process.env.WEB_APP_URL;

	const attachments: Mail.Attachment[] = [
		{
			// content: logo,
			cid: 'logo',
			filename: 'logo_64.png',
			path: path.resolve(__dirname + '../../../assets/logo_64.png'),
			contentDisposition: 'inline',
			contentTransferEncoding: 'base64',
		},
	];

	const replyInfo =
		'<p style="margin-top:1.5em; font-size: 0.8em; color: #888;">This message was sent from email address intended only to automatic messages. Please do not reply.</p>';

	const html = `<div style="
		font-size: 1.1em;
		width: 90%; 
		max-width: 600px;
		min-width: 300px; 
		margin: auto; 
		font-family: sans-serif;
		text-align: center;
		z-index: 100;
	">
	<a href="${WEB_URL}/" target="blank" style="text-decoration: none;">
			<div style="width: 70px; height: 70px; position: absolute; left: 5px; z-index: 0;"><img src="cid:logo" style="width: 70px; height: 70px;" ></div>
			<h1 style="text-align: center; width: 100%; color: #009688;">FTS2020</h1>
		</a>
		<h2>Hello ${recipient && recipient.userName ? recipient.userName : email}</h2>

		<p style="font-size: 1.2em;">You have been invited by <strong>${
			owner.emailAddress
		} <span style="color: #888;"></span>(${
		owner.userName
	})</strong> to join a flat in <strong style="font-style: italic;">FTS2020</strong> application.</p>
		<p style="font-size: 1.2em;"><a href="${WEB_URL}/invitation/${token}" target="blank" title="Open FTS2020 web page.">Click this link
			to view invitation and decide if accept or decline it.</a></p>
		<p>If you are not yet member of <strong style="font-style: italic;">FTS2020</strong> you can also sign up.</p>
		<div style="
				margin: 34px 16px 24px 16px; 
				padding: 4px 16px;
				border: 2px solid #009688;
				box-shadow: 0 2px 3px #009688;
				background-color: white;
				style="text-align: initial;"
			">
			<h2 style="text-align: center;">${flat.name}</h2>
			<hr />
			<p><span style="color: #888;">Created by:</span> ${owner.emailAddress} ${
		owner.userName
	}</p>
			<p><span style="color: #888;">Created at:</span> ${moment(flat.createAt).format('LL')}</p>
			<hr />
			<p style="color: #888;">Description:</p>
			<p>${flat.description ? flat.description : '-'}</p>
		</div>
		${replyInfo}
	</div>`;

	const plainText = `You have been invited by ${owner.emailAddress} (${owner.userName}) to join a flat in FTS2020 application.\
	Click link below to open FTS2020 webpage and decide if you want to accept or reject invitation.\
	${WEB_URL}/invitation/${token}?email=${email}`;

	return { html, plainText, attachments };
};
