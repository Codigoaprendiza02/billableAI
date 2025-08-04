// Test Authentication Middleware
// Bypasses authentication for testing purposes

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

// Test authentication that creates a mock user for testing
export const testAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Create a mock user for testing
    req.user = {
      userId: '688a35729151cc3796ed040a', // Test user ID
      email: 'test@billableai.com',
      name: 'Test User'
    };
    console.log('🔧 Test auth: Created mock user for testing');
  } else {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('🔧 Test auth: Valid token provided');
    } catch (error) {
      // Create a mock user even if token is invalid
      req.user = {
        userId: '688a35729151cc3796ed040a',
        email: 'test@billableai.com',
        name: 'Test User'
      };
      console.log('🔧 Test auth: Invalid token, created mock user');
    }
  }

  next();
};

// Test authentication that always passes
export const testAuthOptional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Create a mock user if token is invalid
      req.user = {
        userId: '688a35729151cc3796ed040a',
        email: 'test@billableai.com',
        name: 'Test User'
      };
    }
  } else {
    // Create a mock user if no token
    req.user = {
      userId: '688a35729151cc3796ed040a',
      email: 'test@billableai.com',
      name: 'Test User'
    };
  }

  next();
}; 