import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Notification identification
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notificationId: { type: String, required: true },
  
  // Notification content
  type: { 
    type: String, 
    enum: [
      'email_tracking_started',
      'email_tracking_stopped', 
      'summary_generated',
      'confirmation_required',
      'error_occurred',
      'billing_entry_created',
      'token_refresh_needed',
      'assistant_context_saved'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Notification priority and urgency
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  
  // Notification status
  status: { 
    type: String, 
    enum: ['pending', 'delivered', 'read', 'dismissed', 'failed'], 
    default: 'pending' 
  },
  
  // Related data
  relatedData: {
    emailSessionId: String,
    summaryId: String,
    errorCode: String,
    actionRequired: Boolean,
    actionUrl: String
  },
  
  // Delivery channels
  channels: {
    desktop: { 
      enabled: { type: Boolean, default: true },
      delivered: { type: Boolean, default: false },
      deliveredAt: Date
    },
    extension: { 
      enabled: { type: Boolean, default: true },
      delivered: { type: Boolean, default: false },
      deliveredAt: Date
    },
    email: { 
      enabled: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      deliveredAt: Date
    }
  },
  
  // User interaction
  readAt: Date,
  dismissedAt: Date,
  actionTakenAt: Date,
  
  // Retry mechanism for failed notifications
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  nextRetryAt: Date,
  
  // Expiration
  expiresAt: Date
  
}, { timestamps: true });

// Define unique index separately to avoid conflicts
notificationSchema.index({ notificationId: 1 }, { unique: true });

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 });

// Mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Mark notification as dismissed
notificationSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  this.dismissedAt = new Date();
  return this.save();
};

// Mark delivery for a specific channel
notificationSchema.methods.markDelivered = function(channel) {
  if (this.channels[channel]) {
    this.channels[channel].delivered = true;
    this.channels[channel].deliveredAt = new Date();
    
    // Check if all enabled channels have been delivered
    const enabledChannels = Object.keys(this.channels).filter(ch => this.channels[ch].enabled);
    const deliveredChannels = enabledChannels.filter(ch => this.channels[ch].delivered);
    
    if (enabledChannels.length === deliveredChannels.length) {
      this.status = 'delivered';
    }
  }
  return this.save();
};

// Schedule retry for failed notification
notificationSchema.methods.scheduleRetry = function(delayMinutes = 5) {
  if (this.retryCount < this.maxRetries) {
    this.retryCount += 1;
    this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    this.status = 'pending';
  } else {
    this.status = 'failed';
  }
  return this.save();
};

// Check if notification is expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

export default mongoose.model('Notification', notificationSchema);