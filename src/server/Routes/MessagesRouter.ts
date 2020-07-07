import { Router } from 'express';
import ensureAuthenticated from '../middleware/ensureAuthenticated';
import { sendMessageToUser } from '../controllers/MessagesController';
const router = Router();

router.post('/', ensureAuthenticated, sendMessageToUser);

export default router;
