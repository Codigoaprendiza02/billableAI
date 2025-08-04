console.log('Loaded ENV:', process.env.CLIO_CLIENT_ID, process.env.CLIO_CLIENT_SECRET);
import dotenv from 'dotenv';

// Load environment variables from .env file, fallback to env.local
dotenv.config({ path: './.env' });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: './env.local' });
}

// Debug: Log environment variables after loading
console.log('🔧 Environment variables loaded:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'configured' : 'not set');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'not set');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'not set');
console.log('  CLIO_CLIENT_ID:', process.env.CLIO_CLIENT_ID ? `${process.env.CLIO_CLIENT_ID.substring(0, 10)}...` : 'not set');

export const PORT = process.env.PORT || 3001;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billableai';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const CLIO_CLIENT_ID = process.env.CLIO_CLIENT_ID;
export const CLIO_CLIENT_SECRET = process.env.CLIO_CLIENT_SECRET;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [];

// Extension configuration
export const EXTENSION_ID = process.env.EXTENSION_ID || 'bcpopkbljafiiclbkhkcpegmlhdpknfd';

// Email configuration
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;

// SMS configuration (Twilio)
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; 