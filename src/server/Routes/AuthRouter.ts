import { Router } from 'express';
import { logIn, register, logOut, changePassword } from '../Controllers/AuthController';
import ensureAuthenticated from '../middleware/ensureAuthenticated';
const router = Router();

router.post('/logout', logOut);
router.post('/login', logIn);
router.post('/register', register);
router.post('/change-password', ensureAuthenticated ,changePassword);

export default router;
