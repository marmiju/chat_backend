// models/ChatModel.js
import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['sent','delivered','read'], default: 'sent' },
  at: { type: Date, default: Date.now }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  deliveries: [deliverySchema], // per-member delivery/read status
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);
