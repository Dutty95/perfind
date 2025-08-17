import mongoose from 'mongoose';
import { encryptAmount, decryptAmount } from '../config/encryption.js';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  amount: {
    type: mongoose.Schema.Types.Mixed, // Allow both Number and String (encrypted)
    required: [true, 'Budget amount is required'],
    set: encryptAmount,  // Encrypt on save
    get: decryptAmount   // Decrypt on retrieval
  },
  period: {
    type: String,
    required: [true, 'Budget period is required'],
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  spent: {
    type: mongoose.Schema.Types.Mixed, // Allow both Number and String (encrypted)
    default: 0,
    set: encryptAmount,  // Encrypt on save
    get: decryptAmount   // Decrypt on retrieval
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Ensure getters are applied when converting to JSON
budgetSchema.set('toJSON', { 
  getters: true,
  transform: function(doc, ret) {
    // Ensure amounts are properly decrypted for JSON output
    if (ret.amount && typeof ret.amount === 'string') {
      ret.amount = decryptAmount(ret.amount);
    }
    if (ret.spent && typeof ret.spent === 'string') {
      ret.spent = decryptAmount(ret.spent);
    }
    return ret;
  }
});

// Static methods
budgetSchema.statics.findByUserId = async function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Removed findByIdAndUserId static method to prevent ObjectId casting errors
// Use native mongoose methods directly in controllers

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;