require('dotenv').config();
import logger from '../logger';
import express, { Request, Response, NextFunction } from 'express';
require('express-async-errors');
import createError from 'http-errors';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import errorMiddleware from './middleware/errorMiddleware';
import { expressWinstonLogger } from '../logger/expressLogger';
const KnexSessionStore = require('connect-session-knex')(session);
import passportConfig from './auth/passport';
import { SESSION_DURATION } from '../config/config';
import router from './Routes/routes';
passportConfig(passport);
const isDevMode = process.env.NODE_ENV === 'development';

export const app = express();
app.use(
	cors({
		origin: true,
		credentials: true,
	})
);
app.use(
	express.json({
		limit: '25mb',
	})
);
app.use(
	express.urlencoded({
		extended: true,
		limit: '25mb',
	})
);

const store = new KnexSessionStore({
	knex: require('../db'),
	tablename: 'sessions', // optional. Defaults to 'sessions'
});

if (!isDevMode) {
	app.set('trust proxy', 1);
}

const expressSession = session({
	secret: process.env.SESSION_SECRET || 'default-session-secret',
	name: process.env.SESSION_NAME || 'default-session-name',
	resave: false,
	saveUninitialized: isDevMode ? true : false,
	store: store,
	cookie: {
		maxAge: SESSION_DURATION,
		httpOnly: true,
		secure: !isDevMode ? true : false,
	},
});

app.use(expressSession);
logger.info('About to initialize Passport');
app.use(passport.initialize());
app.use(passport.session());

app.use(expressWinstonLogger);
logger.info('About to add Routes');
app.use(router);
app.get('/', (_req: Request, res: Response) => {
	const text = [
		'<!DOCTYPE html>',
		'<html lang="en">',
		'<head>',
		'	<meta charset="UTF-8">',
		'	<meta name="viewport" content="width=device-width, initial-scale=1.0">',
		'	<title>FTS2020</title>',
		'</head>',
		'<body>',
		`<script>
			window.open((navigator.userAgent.indexOf("Android") === -1 ? 
					"${process.env.WEB_APP_URL}" 
					: "${process.env.MOBILE_APP_URL}")
				,"_self");
		</script>`,
		'</body>',
		'</html>',
	].join(' ');
	res.status(200).send(text);
});

app.get('/debug', (_req, res) => {
	const txt = [
		'<!DOCTYPE html>',
		'<html lang="pl">',
		'<head>',
		'	<meta charset="UTF-8">',
		'	<meta name="viewport" content="width=device-width, initial-scale=1.0">',
		'	<title>Document</title>',
		'</head>',
		'<body>',
		'<script>',
		'window.document.body.innerHTML = `\n',
		'<h1 color="teal">FTS 2020</h1>\n',
		'<ul>\n',
		'<li>userAgent: ${navigator.userAgent}</li>\n',
		'<li>platform: ${navigator.platform}</li>\n',
		'<li>vendor: ${navigator.vendor}</li>\n',
		'</ul>\n',
		'<p>WORK!!!!!!!!</p>`',
		'</script>',
		'<hr />',
		'</body>',
		'</html>',
	].join(' ');
	res.send(txt);
});

// catch 404 and forward to error handler
app.use(function (_req: Request, _res: Response, next: NextFunction) {
	next(createError(404));
});

// error handler
app.use(errorMiddleware);
