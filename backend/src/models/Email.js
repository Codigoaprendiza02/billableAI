import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  threadId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [String],
  subject: String,
  content: String,
  typingTime: Number, // in seconds
  sentAt: Date,
  
  // Billable tracking fields
  isBillable: { type: Boolean, default: false },
  billableCategory: { 
    type: String, 
    enum: ['legal', 'business', 'time-sensitive', 'general-billable', 'non-billable'],
    default: 'non-billable'
  },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  billableKeywords: [String],
  billableTime: { type: Number, default: 0 }, // estimated billable time in minutes
  
  // AI summary fields
  aiSummary: String,
  aiModel: String,
  aiConfidence: Number
}, { timestamps: true });

export default mongoose.model('Email', emailSchema); 