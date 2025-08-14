import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['income', 'expense']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  }
}, {
  timestamps: true
});

// Static method to find transactions by user ID
transactionSchema.statics.findByUserId = async function(userId) {
  return this.find({ userId }).sort({ date: -1 });
};

// Static method to find transaction by ID and user ID
transactionSchema.statics.findByIdAndUserId = async function(id, userId) {
  return this.findOne({ _id: id, userId });
};

// Static method to get transaction statistics for a user
transactionSchema.statics.getStatsByUserId = async function(userId) {
  const userTransactions = await this.findByUserId(userId);
  
  const totalIncome = userTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = userTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalBalance = totalIncome - totalExpenses;
  
  // Calculate current month statistics
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthlyTransactions = userTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  return {
    totalIncome,
    totalExpenses,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    transactionCount: userTransactions.length
  };
};

// Static method to get monthly income vs expense data
transactionSchema.statics.getMonthlyData = async function(userId, months = 6) {
  const userTransactions = await this.findByUserId(userId);
  const monthlyData = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const monthTransactions = userTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
    });
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    monthlyData.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year,
      income,
      expense
    });
  }
  
  return monthlyData;
};

// Static method to get category breakdown
transactionSchema.statics.getCategoryData = async function(userId) {
  const userTransactions = await this.findByUserId(userId);
  const expenseTransactions = userTransactions.filter(t => t.type === 'expense');
  
  const categoryTotals = {};
  let totalExpenses = 0;
  
  expenseTransactions.forEach(t => {
    const amount = Math.abs(t.amount);
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
    totalExpenses += amount;
  });
  
  const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
  }));
  
  return categoryData.sort((a, b) => b.amount - a.amount);
};

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;