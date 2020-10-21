import { Router } from 'express';
import { redirectToInvitation } from '../Controllers/RedirectController';
const router = Router();

router.get('/invitation/:token', redirectToInvitation);

export default router;
