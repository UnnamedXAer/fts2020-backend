import { Router } from 'express';
import {
	logIn,
	register,
	logOut,
	changePassword,
	githubAuthenticate,
	githubAuthenticateCallback,
	getCurrentUser,
	googleAuthenticate,
	googleAuthenticateCallback,
} from '../controllers/AuthController';
import ensureAuthenticated from '../middleware/ensureAuthenticated';
const router = Router();

router.post('/logout', logOut);
router.post('/login', logIn);
router.post('/register', register);
router.post('/change-password', ensureAuthenticated, changePassword);

router.get('/github/login', githubAuthenticate);
router.get('/github/callback', githubAuthenticateCallback);
router.get('/google/login', googleAuthenticate);
router.get('/google/callback', googleAuthenticateCallback);

router.get('/logged-user', ensureAuthenticated, getCurrentUser);

export default router;
