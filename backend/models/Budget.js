import mongoose from 'mongoose';

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
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount must be positive']
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
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static methods
budgetSchema.statics.findByUserId = async function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Removed findByIdAndUserId static method to prevent ObjectId casting errors
// Use native mongoose methods directly in controllers

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;