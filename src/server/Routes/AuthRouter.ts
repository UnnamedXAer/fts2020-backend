import { Router } from 'express';
import { logIn, register, logOut } from '../Controllers/AuthController';
const router = Router();

router.post('/logout', logOut);
router.post('/login', logIn);
router.post('/register', register);

export default router;
