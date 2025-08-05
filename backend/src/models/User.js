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
  refreshTokens: [{ 
    token: String, 
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now },
    device: String // Device identifier for multi-device support
  }],
  lastActiveAt: { type: Date, default: Date.now },
  
  // AI preferences with comprehensive settings
  aiPreferences: {
    emailAutoSuggestions: { type: Boolean, default: true },
    defaultTone: { type: String, enum: ['Formal', 'Casual'], default: 'Formal' },
    autoSummaryGeneration: { type: Boolean, default: true },
    preferredResponseLength: { type: String, enum: ['Short', 'Medium', 'Long'], default: 'Medium' },
    customPrompts: [{ name: String, content: String }]
  },
  
  // Billable logging preferences
  billableLogging: {
    defaultTimeUnit: { type: String, enum: ['Hours', 'Minutes', 'Seconds'], default: 'Hours' },
    confirmationBeforeLogging: { type: Boolean, default: true },
    confirmationBeforeAttaching: { type: Boolean, default: true },
    autoTrackingEnabled: { type: Boolean, default: true },
    minimumTrackingTime: { type: Number, default: 30 } // seconds
  },
  
  // Two-factor authentication
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    method: { type: String, enum: ['Email', 'SMS'], default: 'Email' },
    email: String,
    phone: String,
    secret: String
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
    summaries: { type: Number, default: 0 },
    totalBillableTime: { type: Number, default: 0 }, // in minutes
    weeklyTimeSpent: { type: Number, default: 0 },
    monthlyTimeSpent: { type: Number, default: 0 }
  },
  
  // Assistant persistence data
  assistantContext: {
    conversationHistory: [{ 
      timestamp: Date, 
      message: String, 
      response: String,
      emailContext: mongoose.Schema.Types.Mixed 
    }],
    preferences: {
      defaultClientMatter: String,
      commonTasks: [String],
      billingRates: { type: Map, of: Number }
    },
    lastUsedEmail: {
      to: String,
      subject: String,
      content: String,
      timestamp: Date
    }
  },
  
  // Notification preferences
  notificationSettings: {
    emailTrackingNotifications: { type: Boolean, default: true },
    summaryGenerationNotifications: { type: Boolean, default: true },
    confirmationNotifications: { type: Boolean, default: true },
    errorNotifications: { type: Boolean, default: true },
    desktopNotifications: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: false }
  },
  
  // Onboarding completion
  hasCompletedOnboarding: { type: Boolean, default: false }
  
}, { timestamps: true });

// Indexes for performance
<<<<<<< HEAD
userSchema.index({ email: 1 });
=======
>>>>>>> 5189f8f (updations)
userSchema.index({ 'refreshTokens.token': 1 });
userSchema.index({ 'refreshTokens.expiresAt': 1 });

// Clean up expired refresh tokens
userSchema.methods.cleanupExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(tokenObj => 
    tokenObj.expiresAt > new Date()
  );
  return this.save();
};

// Add refresh token
userSchema.methods.addRefreshToken = function(token, expiresAt, device = 'unknown') {
  this.refreshTokens.push({ token, expiresAt, device });
  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(tokenObj => tokenObj.token !== token);
  return this.save();
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

export default mongoose.model('User', userSchema); 