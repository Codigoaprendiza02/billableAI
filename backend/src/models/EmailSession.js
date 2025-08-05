import mongoose from 'mongoose';

const emailSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Email details
  emailData: {
    to: [String],
    cc: [String],
    bcc: [String],
    subject: String,
    content: String,
    from: String,
    gmailDraftId: String,
    gmailMessageId: String,
    gmailThreadId: String
  },
  
  // Timing information
  startTime: { type: Date, required: true },
  endTime: Date,
  totalDuration: Number, // in seconds
  activeDuration: Number, // actual typing/active time in seconds
  pauseDuration: Number, // idle time in seconds
  
  // Activity tracking
  activities: [{
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['start', 'pause', 'resume', 'content_change', 'draft_save', 'send', 'stop'] },
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Typing statistics
  typingStats: {
    charactersTyped: { type: Number, default: 0 },
    wordsTyped: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    averageWPM: { type: Number, default: 0 }
  },
  
  // Session status
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'abandoned', 'sent'], 
    default: 'active' 
  },
  
  // AI assistance used
  aiAssistance: {
    suggestionsUsed: { type: Number, default: 0 },
    autoCompletionsUsed: { type: Number, default: 0 },
    summaryGenerated: { type: Boolean, default: false },
    totalAIInteractions: { type: Number, default: 0 }
  },
  
  // Billing information
  billingInfo: {
    isBillable: { type: Boolean, default: true },
    rate: Number, // hourly rate
    amount: Number, // calculated billable amount
    clientMatter: String,
    description: String,
    hasBeenLogged: { type: Boolean, default: false },
    clioTimeEntryId: String
  },
  
  // Final summary
  summary: {
    generatedSummary: String,
    keyPoints: [String],
    actionItems: [String],
    confidence: Number // AI confidence score
  },
  
  // Notifications sent
  notifications: [{
    type: String,
    timestamp: { type: Date, default: Date.now },
    success: Boolean,
    message: String
  }]
  
}, { timestamps: true });

// Indexes for performance
emailSessionSchema.index({ userId: 1, startTime: -1 });
emailSessionSchema.index({ sessionId: 1 });
emailSessionSchema.index({ status: 1 });
emailSessionSchema.index({ 'emailData.gmailDraftId': 1 });

// Calculate total duration
emailSessionSchema.methods.calculateDuration = function() {
  if (this.startTime && this.endTime) {
    this.totalDuration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  return this.totalDuration;
};

// Add activity
emailSessionSchema.methods.addActivity = function(type, data = {}) {
  this.activities.push({ type, data });
  return this.save();
};

// Update session status
emailSessionSchema.methods.updateStatus = function(status) {
  this.status = status;
  if (status === 'completed' || status === 'sent' || status === 'abandoned') {
    this.endTime = new Date();
    this.calculateDuration();
  }
  return this.save();
};

// Calculate billable amount
emailSessionSchema.methods.calculateBillableAmount = function() {
  if (this.billingInfo.rate && this.totalDuration) {
    const hours = this.totalDuration / 3600;
    this.billingInfo.amount = hours * this.billingInfo.rate;
  }
  return this.billingInfo.amount;
};

export default mongoose.model('EmailSession', emailSessionSchema);