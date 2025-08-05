import express from 'express';
import { 
  summarize, 
  suggest, 
  cleanContent 
} from '../controllers/aiController.js';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

// Temporary test endpoint (no auth required)
router.post('/test-summarize', async (req, res) => {
  try {
    const { emailText, timeSpent, model = 'template' } = req.body;
    
    if (!emailText || !timeSpent) {
      return res.status(400).json({ error: 'Email text and time spent are required' });
    }
    
    // Import the service directly for testing
    const aiService = await import('../services/gptService.js');
    const summaryResult = await aiService.generateSummary(emailText, timeSpent, {}, model);
    
    res.json({
      success: true,
      summary: summaryResult.summary,
      metadata: summaryResult.metadata
    });
    
  } catch (error) {
    console.error('Test summarize error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// POST /api/ai/summarize (requires authentication)
router.post('/summarize', requireAuth, summarize);

// POST /api/ai/suggest (requires authentication)
router.post('/suggest', requireAuth, suggest);

// POST /api/ai/clean (requires authentication)
router.post('/clean', requireAuth, cleanContent);

export default router; 