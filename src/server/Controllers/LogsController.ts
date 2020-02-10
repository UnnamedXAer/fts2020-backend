import { RequestHandler } from 'express';
import LogsData from '../DataAccess/Logs/LogsData';
import logger from '../../logger';
import { QueryOptions } from 'winston';
import HttpException from '../utils/HttpException';

export const getLogs: RequestHandler = (_req, res, next) => {
	logger.info('Get All Logs');
    LogsData.getAll()
        .then(logs => {
			
			const options: QueryOptions = {
				from: new Date(Date.now() - 24 * 60 * 60 * 1000),
				until: new Date(),
				limit: 100,
				start: 0,
				order: 'desc',
				fields: ['message']
			};

			logger.query(options, function(err, winstonLogs) {
				if (err) {
					throw err;
				}
				res.json({
					date: new Date().toISOString(),
					dbLogs: logs,
					winstonLogs: winstonLogs
				});
			});

        })
        .catch(err => {
            next(new HttpException(500, err));
        });
};