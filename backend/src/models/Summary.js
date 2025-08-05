import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  email: { type: mongoose.Schema.Types.ObjectId, ref: 'Email', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  model: { type: String, enum: ['gpt', 'gemini'], default: 'gpt' }
}, { timestamps: true });

export default mongoose.model('Summary', summarySchema); 