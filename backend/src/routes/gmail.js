import express from 'express';
import { 
  fetchThreads, 
  processEmail, 
  getEmailContent, 
  getGmailProfile,
  getBillableEmails,
  trackAndSendEmail
} from '../controllers/gmailController.js';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

// GET /api/gmail/threads (requires authentication)
router.get('/threads', requireAuth, fetchThreads);

// POST /api/gmail/process (requires authentication)
router.post('/process', requireAuth, processEmail);

// GET /api/gmail/messages/:messageId (requires authentication)
router.get('/messages/:messageId', requireAuth, getEmailContent);

// GET /api/gmail/profile (requires authentication)
router.get('/profile', requireAuth, getGmailProfile);

// GET /api/gmail/billable (requires authentication)
router.get('/billable', requireAuth, getBillableEmails);

// POST /api/gmail/track-and-send (requires authentication)
router.post('/track-and-send', requireAuth, trackAndSendEmail);

export default router; 