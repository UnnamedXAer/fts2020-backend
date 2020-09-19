require('dotenv').config();
import logger from '../logger';
import express, { Request, Response, NextFunction } from 'express';
require('express-async-errors');
import createError from 'http-errors';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import errorMiddleware from './middleware/errorMiddleware';
import router from './routes';
import { expressWinstonLogger } from '../logger/expressLogger';
const KnexSessionStore = require('connect-session-knex')(session);
import passportConfig from './auth/passport';
import { SESSION_DURATION } from '../config/config';
passportConfig(passport);

export const app = express();
app.use(
	cors({
		// origin: `http://localhost:${process.env.CLIENT_PORT}`,
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

const expressSession = session({
	secret: process.env.SESSION_SECRET || 'default-session-secret',
	resave: false,
	saveUninitialized: true,
	store: store,
	// cookie: {secure: true}
	cookie: { maxAge: SESSION_DURATION },
});

app.use(expressSession);
logger.info('About to initialize Passport');
app.use(passport.initialize());
app.use(passport.session());

app.use(expressWinstonLogger);
logger.info('About to add Routes');
app.use(router);
app.get('/', (_req: Request, res: Response) => {
	res.send({ response: 'FTS 2020' }).status(200);
});

app.get('/mobile/invitation', (_req: Request, res: Response) => {
	const href = `exp://192.168.1.9:19000/--/invitations/${'ecd736ac-9077-486f-acb0-82246a32c535'}`;
	res.send(
		`<h1 color="teal">FTS 2020</h2>
		<p>${new Date().toLocaleString()}</p>
		<hr />
	<a style="font-size:40px" href="${href}" title="Open FTS2020 web page.">HERE: ${href}</a>
	`
	);
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
