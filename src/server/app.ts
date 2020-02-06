require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import errorMiddleware from './middleware/errorMiddleware';
// const KnexSessionStore = require('connect-session-knex')(session);
export const app = express();
app.use(
    cors({
        origin: `http://localhost:${process.env.CLIENT_PORT}`,
        credentials: true
    })
);
app.use(
    express.json({
        limit: '25mb'
    })
);
app.use(
    express.urlencoded({
        extended: true,
        limit: '25mb'
    })
);

// const store = new KnexSessionStore({
//     knex: require('../db'),
//     tablename: 'sessions' // optional. Defaults to 'sessions'
// });

const expressSession = session({
    secret: 'tmpSecret',
    resave: false,
    saveUninitialized: true,
    // store: store
    // cookie: {secure: true}
});

app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

// routes here

app.get('/', (_req: Request, res: Response) => {
    res.send({ response: 'FTS 2020' }).status(200);
});

// catch 404 and forward to error handler
app.use(function(_req: Request, _res: Response, next: NextFunction) {
    next(createError(404));
});

// error handler
app.use(errorMiddleware);
