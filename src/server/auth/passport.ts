import bcrypt from 'bcrypt';
import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github';
import UserData from '../dataAccess/User/UserData';
import UserModel from '../models/UserModel';
import { UserExternalRegisterModel } from '../models/UserAuthModels';
import logger from '../../logger';

export default (passport: PassportStatic) => {
	passport.use(
		new LocalStrategy(
			{
				usernameField: 'emailAddress',
				passwordField: 'password',
			},
			async (emailAddress, password, done) => {
				try {
					const user = await UserData.getByEmailAddressAuth(emailAddress);
					if (!user) {
						return done(null, false, {
							message: 'Email Address or Password are incorrect.',
						});
					}
					const isPasswordMatch = await bcrypt.compare(
						password,
						user.password!
					);

					if (isPasswordMatch) {
						user.password = void 0;
						return done(null, user);
					} else {
						return done(null, false, {
							message: 'Email Address or Password are incorrect.',
						});
					}
				} catch (err) {
					return done(err);
				}
			}
		)
	);

	passport.use(
		new GitHubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID as string,
				clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
				callbackURL: '/auth/github/callback',
				scope: ['read:user'],
			},
			async (_accessToken, _refreshToken, profile, done) => {
				try {
					logger.info('[ GitHubStrategy ] profile: %o', profile);

					let emailAddress: string;

					if (profile.emails && profile.emails[0]) {
						emailAddress = profile.emails[0].value;
					} else {
						return done(void 0, void 0, {
							message: 'Fail to Authenticate with GitHub.',
						});
					}

					let user = await UserData.getByEmailAddressAuth(emailAddress);
					if (!user) {
						let avatarUrl = '';
						if (profile.photos && profile.photos[0]) {
							avatarUrl = profile.photos[0].value;
						}

						const userName: string = profile.displayName;

						const newGitHubUser = new UserExternalRegisterModel(
							emailAddress,
							userName,
							avatarUrl,
							'github'
						);

						const createdUser = await UserData.create(newGitHubUser);
						logger.info(
							'[ GitHubStrategy ] - new user created: %o',
							createdUser
						);
						user = await UserData.getById(createdUser.id);
					}
					user!.password = void 0;
					return done(void 0, user as Object);
				} catch (err) {
					return done(err);
				}
			}
		)
	);

	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID as string,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
				callbackURL: '/auth/google/callback',
			},
			async (_accessToken, _refreshToken, profile, done) => {
				try {
					logger.info('[ GoogleStrategy ] profile: %o', profile);

					let emailAddress: string;

					if (profile.emails && profile.emails[0]) {
						emailAddress = profile.emails[0].value;
					} else {
						return done(void 0, false, {
							message: 'Fail to Auth with Google.',
						});
					}

					let user = await UserData.getByEmailAddressAuth(emailAddress);
					if (!user) {
						let avatarUrl = '';
						if (profile.photos && profile.photos[0]) {
							avatarUrl = profile.photos[0].value;
						}

						const userName: string = profile.displayName;

						const newGoogleUser = new UserExternalRegisterModel(
							emailAddress,
							userName,
							avatarUrl,
							'google'
						);

						const createdUser = await UserData.create(newGoogleUser);
						logger.info(
							'[ GoogleStrategy ] - new user created: %o',
							createdUser
						);
						user = await UserData.getById(createdUser.id);
					}
					user!.password = void 0;
					return done(void 0, user);
				} catch (err) {
					return done(err);
				}
			}
		)
	);

	passport.serializeUser<UserModel, number>((user, done) => {
		done(null, user.id);
	});

	// when the cookie comes back to us from the browser when make request we receive that id then we find the user that mach to given id
	passport.deserializeUser<UserModel | false, number>(async (id, done) => {
		try {
			const user = await UserData.getById(id);
			if (user) {
				done(null, user);
			} else {
				done(new Error('User does not exists!'));
			}
		} catch (err) {
			done(err, false);
		}
	});
};
