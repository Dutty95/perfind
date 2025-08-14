// backend/models/Goal.js

import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Goal type is required'],
    enum: ['save', 'reduce', 'earn', 'invest'],
    default: 'save'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0, 'Target amount must be positive']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    required: function() { return this.isRecurring; }
  }
}, {
  timestamps: true
});

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.round((this.currentAmount / this.targetAmount) * 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for goal status based on progress and dates
goalSchema.virtual('goalStatus').get(function() {
  const progress = this.progressPercentage;
  const daysLeft = this.daysRemaining;
  
  if (this.status === 'completed' || progress >= 100) {
    return 'completed';
  }
  
  if (daysLeft < 0) {
    return 'overdue';
  }
  
  if (this.type === 'save' || this.type === 'earn' || this.type === 'invest') {
    if (progress >= 75) return 'on-track';
    if (progress >= 50) return 'behind';
    return 'at-risk';
  } else if (this.type === 'reduce') {
    // For reduction goals, lower current amount is better
    if (progress <= 25) return 'excellent';
    if (progress <= 50) return 'on-track';
    if (progress <= 75) return 'behind';
    return 'at-risk';
  }
  
  return 'active';
});

// Ensure virtual fields are serialized
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

// Static methods
goalSchema.statics.findByUserId = async function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

goalSchema.statics.findActiveByUserId = async function(userId) {
  return this.find({ userId, status: 'active' }).sort({ priority: -1, targetDate: 1 });
};

goalSchema.statics.findByIdAndUserId = async function(id, userId) {
  return this.findOne({ _id: id, userId });
};

// Instance methods
goalSchema.methods.updateProgress = function(amount) {
  this.currentAmount = Math.max(0, amount);
  
  // Auto-complete goal if target is reached
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
  }
  
  return this.save();
};

goalSchema.methods.addProgress = function(amount) {
  return this.updateProgress(this.currentAmount + amount);
};

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;