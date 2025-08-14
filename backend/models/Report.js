// backend/models/Report.js

import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['income', 'expense', 'budget', 'goal', 'comprehensive', 'custom'],
    default: 'comprehensive'
  },
  period: {
    type: String,
    required: [true, 'Report period is required'],
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  categories: [{
    type: String,
    trim: true
  }],
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  summary: {
    totalIncome: {
      type: Number,
      default: 0
    },
    totalExpenses: {
      type: Number,
      default: 0
    },
    netIncome: {
      type: Number,
      default: 0
    },
    budgetUtilization: {
      type: Number,
      default: 0
    },
    goalProgress: {
      type: Number,
      default: 0
    },
    savingsRate: {
      type: Number,
      default: 0
    }
  },
  insights: [{
    type: {
      type: String,
      enum: ['warning', 'info', 'success', 'recommendation']
    },
    message: String,
    category: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleFrequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    required: function() { return this.isScheduled; }
  },
  nextGenerationDate: {
    type: Date,
    required: function() { return this.isScheduled; }
  },
  status: {
    type: String,
    enum: ['draft', 'generated', 'archived'],
    default: 'generated'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ userId: 1, type: 1, period: 1 });
reportSchema.index({ userId: 1, startDate: 1, endDate: 1 });

// Virtual for report duration in days
reportSchema.virtual('durationDays').get(function() {
  const diffTime = this.endDate - this.startDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for formatted period
reportSchema.virtual('formattedPeriod').get(function() {
  const start = this.startDate.toLocaleDateString();
  const end = this.endDate.toLocaleDateString();
  return `${start} - ${end}`;
});

// Ensure virtual fields are serialized
reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

// Static methods
reportSchema.statics.findByUserId = async function(userId, options = {}) {
  const { type, period, limit = 20, skip = 0 } = options;
  
  let filter = { userId };
  if (type) filter.type = type;
  if (period) filter.period = period;
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

reportSchema.statics.findByIdAndUserId = async function(id, userId) {
  return this.findOne({ _id: id, userId });
};

reportSchema.statics.findScheduledReports = async function() {
  const now = new Date();
  return this.find({
    isScheduled: true,
    nextGenerationDate: { $lte: now },
    status: { $ne: 'archived' }
  });
};

// Instance methods
reportSchema.methods.calculateNextGenerationDate = function() {
  if (!this.isScheduled || !this.scheduleFrequency) return null;
  
  const now = new Date();
  const next = new Date(now);
  
  switch (this.scheduleFrequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
};

reportSchema.methods.updateNextGenerationDate = function() {
  if (this.isScheduled) {
    this.nextGenerationDate = this.calculateNextGenerationDate();
  }
  return this.save();
};

reportSchema.methods.addInsight = function(type, message, category = null, priority = 'medium') {
  this.insights.push({ type, message, category, priority });
  return this.save();
};

const Report = mongoose.model('Report', reportSchema);
export default Report;