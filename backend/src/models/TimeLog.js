import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  summary: { type: mongoose.Schema.Types.ObjectId, ref: 'Summary', required: true },
  client: String,
  matter: String,
  clioLogId: String,
  status: { type: String, enum: ['pending', 'logged', 'failed'], default: 'pending' },
  duration: Number, // in seconds
  logTime: Date
}, { timestamps: true });

export default mongoose.model('TimeLog', timeLogSchema); 