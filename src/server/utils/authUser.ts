import { Request } from 'express';
import UserModel from '../Models/UserModel';

export function loggedUserId (req: Request) {
	return loggedUser(req)?.id;
}

export function loggedUser(req: Request) {
	return <UserModel>req.user;
}