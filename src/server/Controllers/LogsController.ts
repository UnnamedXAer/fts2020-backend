import { RequestHandler } from 'express';
import LogsData from '../DataAccess/Logs/LogsData';

export const getLogs: RequestHandler = (_req, res, next) => {
    LogsData.getAll()
        .then(rooms => {
            res.json(rooms);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
};