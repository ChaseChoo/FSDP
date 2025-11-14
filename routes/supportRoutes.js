import express from 'express';
import { startSupportSession, postSupportMessage, streamSupportMessages, listSessions, getSessionMessages } from '../controllers/supportController.js';

const router = express.Router();

router.post('/start', startSupportSession);
router.post('/message', postSupportMessage);
router.get('/stream/:sessionId', streamSupportMessages);
router.get('/list', listSessions);
router.get('/messages/:sessionId', getSessionMessages);

export default router;
