require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import session from 'express-session';
const KnexSessionStore = require('connect-session-knex')(session);
import cors from 'cors';
import passport from 'passport';

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

const store = new KnexSessionStore({
    knex: require('../config/database.js'),
    tablename: 'sessions' // optional. Defaults to 'sessions'
});

const expressSession = session({
    secret: 'tmpSecret',
    resave: false,
    saveUninitialized: true,
    store: store
    // cookie: {secure: true}
});

app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

// routes here

app.get('/', (_req: Request, res: Response) => {
    res.send({ response: 'root' }).status(200);
});

// catch 404 and forward to error handler
app.use(function (_req: Request, _res: Response, next: NextFunction) {
	next(createError(404));
});

// error handler
app.use(function(err: any, req: Request, res: Response, _next: NextFunction) {
    const _env = req.app.get('env');
    const error = _env === 'development' ? err : {};

    console.log(
        '[ERROR_HANDLER](%s) \n req.url: %s, \nerr:%O',
        _env,
        req.url,
        err
    );
    // console.log("-> [ERROR_HANDLER]: %o, \nReq.url: %s", JSON.stringify(err, "\t"), req.url);

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = error;

    // render the error page
    res.status(err.status || res.statusCode || 500);
    res.json({
        message: err.message,
        error: error
    });
});