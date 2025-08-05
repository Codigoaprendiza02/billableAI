import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

// Authenticate JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    // Handle mock tokens for testing
    if (token.startsWith('mock_jwt_token_')) {
      console.log('🔍 Mock JWT token detected for testing');
      
      // Use persistent mock user for consistent testing
      if (token === 'mock_jwt_token_persistent') {
        req.user = {
          userId: 'mock_user_persistent',
          email: 'test@example.com',
          name: 'Test User'
        };
      } else {
        req.user = {
          userId: 'mock_user_' + Date.now(),
          email: 'test@example.com',
          name: 'Test User'
        };
      }
      
      next();
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      // Handle mock tokens for testing
      if (token.startsWith('mock_jwt_token_')) {
        console.log('🔍 Mock JWT token detected for testing (optional)');
        
        // Use persistent mock user for consistent testing
        if (token === 'mock_jwt_token_persistent') {
          req.user = {
            userId: 'mock_user_persistent',
            email: 'test@example.com',
            name: 'Test User'
          };
        } else {
          req.user = {
            userId: 'mock_user_' + Date.now(),
            email: 'test@example.com',
            name: 'Test User'
          };
        }
      } else {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.error('Optional auth error:', error);
    }
  }

  next();
}; 