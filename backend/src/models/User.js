import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Basic user information
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  profession: { type: String, default: 'Lawyer' },
  gender: { type: String, enum: ['Male', 'Female', 'Others'], default: '' },
  avatar: { type: String, default: null },
  
  // Authentication fields
  password: { type: String, required: true, select: false },
  
  // AI preferences
  aiPreferences: {
    emailAutoSuggestions: { type: Boolean, default: true },
    defaultTone: { type: String, enum: ['Formal', 'Casual'], default: 'Formal' }
  },
  
  // Billable logging preferences
  billableLogging: {
    defaultTimeUnit: { type: String, enum: ['Hours', 'Minutes', 'Seconds'], default: 'Hours' },
    confirmationBeforeLogging: { type: Boolean, default: true },
    confirmationBeforeAttaching: { type: Boolean, default: true }
  },
  
  // Connection status
  isConnectedToClio: { type: Boolean, default: false },
  
  // OAuth tokens
  gmailTokens: {
    access_token: String,
    refresh_token: String,
    expiry_date: Date
  },
  
  clioTokens: {
    access_token: String,
    refresh_token: String,
    expiry_date: Date
  },
  
  // External service IDs
  googleId: String,
  clioId: String,
  
  // Work history (for display purposes)
  workHistory: {
    emailLogs: { type: Number, default: 0 },
    timeSpent: { type: String, default: '0 hrs' },
    summaries: { type: Number, default: 0 }
  },
  
  // Onboarding completion
  hasCompletedOnboarding: { type: Boolean, default: false }
  
}, { timestamps: true });

export default mongoose.model('User', userSchema); 