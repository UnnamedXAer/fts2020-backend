import { Request } from 'express';
import UserModel from '../models/UserModel';

export function getLoggedUserId (req: Request) {
	return getLoggedUser(req)?.id;
}

export function getLoggedUser(req: Request) {
	return <UserModel>req.user;
}