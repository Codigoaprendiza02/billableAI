import express from 'express';

const router = express.Router();

// Configuration route - serves sensitive config to extension
router.get('/config', (req, res) => {
  try {
    console.log('🔧 Config route accessed - Request details:');
    console.log('  Method:', req.method);
    console.log('  URL:', req.url);
    console.log('  Headers:', req.headers);
    console.log('  Origin:', req.headers.origin);
    console.log('  User-Agent:', req.headers['user-agent']);
    
    // Debug: Log the environment variables
    console.log('🔧 Config route - Environment variables:');
    console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'not set');
    console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'not set');
    console.log('  CLIO_CLIENT_ID:', process.env.CLIO_CLIENT_ID ? `${process.env.CLIO_CLIENT_ID.substring(0, 10)}...` : 'not set');
    
    // Return configuration with necessary keys for extension
    const config = {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      clioClientId: process.env.CLIO_CLIENT_ID,
      geminiApiKey: process.env.GEMINI_API_KEY,
      port: process.env.PORT || 3001,
      nodeEnv: process.env.NODE_ENV || 'development',
      allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:5173,chrome-extension://*'
    };

    console.log('📋 Config being sent to extension:', {
      hasGoogleClientId: !!config.googleClientId,
      hasClioClientId: !!config.clioClientId,
      hasGeminiApiKey: !!config.geminiApiKey,
      geminiApiKeyLength: config.geminiApiKey?.length || 0
    });

    res.json(config);
  } catch (error) {
    console.error('❌ Error serving configuration:', error);
    res.status(500).json({ error: 'Failed to serve configuration' });
  }
});

export default router; 