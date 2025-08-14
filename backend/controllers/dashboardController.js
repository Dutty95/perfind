// backend/controllers/dashboardController.js

import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';

// @desc    Get dashboard overview data
// @route   GET /api/dashboard
// @access  Private
export const getDashboardOverview = async (req, res) => {
  try {
    // Get transaction statistics
    const transactionStats = await Transaction.getStatsByUserId(req.user._id);
    
    // Get recent transactions (last 5)
    const recentTransactions = await Transaction.findByUserId(req.user._id);
    const recentTransactionsLimited = recentTransactions.slice(0, 5);
    
    // Get budget data with spending analysis
    const budgets = await Budget.find({ userId: req.user._id });
    const budgetsWithSpending = await Promise.all(budgets.map(async budget => {
      const categoryTransactions = recentTransactions.filter(transaction => 
        transaction.category === budget.category && transaction.type === 'expense'
      );
      
      // Calculate spending for current budget period
      const currentDate = new Date();
      let periodStart = new Date(budget.startDate);
      let periodEnd = new Date(budget.endDate);
      
      // If budget period has passed, calculate for current period
      if (currentDate > periodEnd) {
        periodStart = new Date();
        switch (budget.period) {
          case 'weekly':
            periodStart.setDate(currentDate.getDate() - currentDate.getDay());
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 7);
            break;
          case 'monthly':
            periodStart.setDate(1);
            periodEnd = new Date(periodStart);
            periodEnd.setMonth(periodStart.getMonth() + 1);
            break;
          case 'yearly':
            periodStart.setMonth(0, 1);
            periodEnd = new Date(periodStart);
            periodEnd.setFullYear(periodStart.getFullYear() + 1);
            break;
        }
      }
      
      const periodSpent = categoryTransactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= periodStart && transactionDate <= periodEnd;
        })
        .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
      
      const remaining = budget.amount - periodSpent;
      const percentage = budget.amount > 0 ? Math.round((periodSpent / budget.amount) * 100) : 0;
      
      return {
        ...budget.toObject(),
        spent: periodSpent,
        remaining: Math.max(0, remaining),
        percentage: Math.min(percentage, 100),
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      };
    }));
    
    // Calculate financial insights
    const insights = await generateFinancialInsights(req.user._id, transactionStats, budgetsWithSpending);
    
    // Calculate savings rate
    const savingsRate = transactionStats.monthlyIncome > 0 
      ? ((transactionStats.monthlyIncome - transactionStats.monthlyExpenses) / transactionStats.monthlyIncome) * 100
      : 0;
    
    const dashboardData = {
      user: {
        name: req.user.name,
        email: req.user.email
      },
      financialSummary: {
        totalBalance: transactionStats.totalBalance,
        monthlyIncome: transactionStats.monthlyIncome,
        monthlyExpenses: transactionStats.monthlyExpenses,
        savingsRate: Math.max(0, savingsRate),
        transactionCount: transactionStats.transactionCount
      },
      recentTransactions: recentTransactionsLimited,
      budgets: budgetsWithSpending.slice(0, 3), // Top 3 budgets for dashboard
      insights,
      quickStats: {
        totalBudgets: budgets.length,
        budgetsOverLimit: budgetsWithSpending.filter(b => b.percentage > 100).length,
        budgetsNearLimit: budgetsWithSpending.filter(b => b.percentage > 80 && b.percentage <= 100).length
      }
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
};

// @desc    Get financial insights and recommendations
// @route   GET /api/dashboard/insights
// @access  Private
export const getFinancialInsights = async (req, res) => {
  try {
    const transactionStats = await Transaction.getStatsByUserId(req.user._id);
    const budgets = await Budget.find({ userId: req.user._id });
    const insights = await generateFinancialInsights(req.user._id, transactionStats, budgets);
    
    res.json(insights);
  } catch (error) {
    console.error('Financial insights error:', error);
    res.status(500).json({ message: 'Server error while generating insights' });
  }
};

// Helper function to generate financial insights
const generateFinancialInsights = async (userId, transactionStats, budgets) => {
  const insights = [];
  
  // Savings rate insight
  const savingsRate = transactionStats.monthlyIncome > 0 
    ? ((transactionStats.monthlyIncome - transactionStats.monthlyExpenses) / transactionStats.monthlyIncome) * 100
    : 0;
  
  if (savingsRate < 10) {
    insights.push({
      type: 'warning',
      title: 'Low Savings Rate',
      message: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`,
      action: 'Consider reviewing your expenses and creating a budget to increase savings.'
    });
  } else if (savingsRate >= 20) {
    insights.push({
      type: 'success',
      title: 'Excellent Savings Rate',
      message: `Great job! Your savings rate of ${savingsRate.toFixed(1)}% exceeds the recommended 20%.`,
      action: 'Keep up the good work and consider investing your surplus savings.'
    });
  }
  
  // Budget insights
  const overBudgetCategories = budgets.filter(b => b.percentage > 100);
  if (overBudgetCategories.length > 0) {
    insights.push({
      type: 'alert',
      title: 'Budget Exceeded',
      message: `You've exceeded your budget in ${overBudgetCategories.length} category(ies): ${overBudgetCategories.map(b => b.category).join(', ')}.`,
      action: 'Review your spending in these categories and consider adjusting your budget or reducing expenses.'
    });
  }
  
  // Income vs Expenses insight
  if (transactionStats.monthlyExpenses > transactionStats.monthlyIncome) {
    insights.push({
      type: 'alert',
      title: 'Spending Exceeds Income',
      message: 'Your monthly expenses are higher than your income. This is unsustainable long-term.',
      action: 'Immediately review and cut unnecessary expenses, or find ways to increase your income.'
    });
  }
  
  // No budgets insight
  if (budgets.length === 0) {
    insights.push({
      type: 'info',
      title: 'Create Your First Budget',
      message: 'You haven\'t created any budgets yet. Budgets help you control spending and reach financial goals.',
      action: 'Start by creating budgets for your main expense categories like food, transportation, and entertainment.'
    });
  }
  
  // Few transactions insight
  if (transactionStats.transactionCount < 5) {
    insights.push({
      type: 'info',
      title: 'Track More Transactions',
      message: 'You have very few transactions recorded. Consistent tracking gives better financial insights.',
      action: 'Try to log all your income and expenses to get a complete picture of your finances.'
    });
  }
  
  return insights;
};

// @desc    Get spending trends over time
// @route   GET /api/dashboard/trends
// @access  Private
export const getSpendingTrends = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const monthlyData = await Transaction.getMonthlyData(req.user._id, months);
    
    // Calculate trends
    const trends = {
      monthlyData,
      averageIncome: monthlyData.reduce((sum, month) => sum + month.income, 0) / monthlyData.length,
      averageExpenses: monthlyData.reduce((sum, month) => sum + month.expense, 0) / monthlyData.length,
      trendDirection: calculateTrendDirection(monthlyData)
    };
    
    res.json(trends);
  } catch (error) {
    console.error('Spending trends error:', error);
    res.status(500).json({ message: 'Server error while fetching spending trends' });
  }
};

// @desc    Get expense analytics data
// @route   GET /api/dashboard/analytics/expenses
// @access  Private
export const getExpenseAnalytics = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const categoryData = await Transaction.getCategoryData(req.user._id);
    const monthlyData = await Transaction.getMonthlyData(req.user._id, months);
    
    // Calculate average spending by category over the specified months
    const allTransactions = await Transaction.findByUserId(req.user._id);
    const expenseTransactions = allTransactions.filter(t => t.type === 'expense');
    
    // Get transactions from the last N months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    const recentExpenses = expenseTransactions.filter(t => new Date(t.date) >= cutoffDate);
    
    // Calculate average spending by category
    const categoryTotals = {};
    recentExpenses.forEach(transaction => {
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
    });
    
    // Convert to average per month
    const averageSpendingByCategory = Object.entries(categoryTotals).map(([category, total]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount: total / months
    }));
    
    // Format monthly expense data
    const monthlyExpenseData = monthlyData.map(month => ({
      month: month.month,
      amount: month.expense,
      categories: {}
    }));
    
    // Add category breakdown to monthly data
    monthlyExpenseData.forEach(monthData => {
      const monthTransactions = recentExpenses.filter(t => {
        const transactionMonth = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
        return transactionMonth === monthData.month;
      });
      
      monthTransactions.forEach(transaction => {
        monthData.categories[transaction.category] = (monthData.categories[transaction.category] || 0) + transaction.amount;
      });
    });
    
    res.json({
      categoryData,
      averageSpendingByCategory,
      monthlyData: monthlyExpenseData,
      totalCategories: Object.keys(categoryTotals).length
    });
  } catch (error) {
    console.error('Expense analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching expense analytics' });
  }
};

// @desc    Get income analytics data
// @route   GET /api/dashboard/analytics/income
// @access  Private
export const getIncomeAnalytics = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const allTransactions = await Transaction.findByUserId(req.user._id);
    const incomeTransactions = allTransactions.filter(t => t.type === 'income');
    
    // Get transactions from the last N months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    const recentIncome = incomeTransactions.filter(t => new Date(t.date) >= cutoffDate);
    
    // Calculate income by source (category)
    const sourceTotals = {};
    recentIncome.forEach(transaction => {
      sourceTotals[transaction.category] = (sourceTotals[transaction.category] || 0) + transaction.amount;
    });
    
    // Convert to average per month
    const averageIncomeBySource = Object.entries(sourceTotals).map(([source, total]) => ({
      source: source.charAt(0).toUpperCase() + source.slice(1),
      amount: total / months
    }));
    
    // Get monthly data
    const monthlyData = await Transaction.getMonthlyData(req.user._id, months);
    
    // Format monthly income data with sources
    const monthlyIncomeData = monthlyData.map(month => ({
      month: month.month,
      amount: month.income,
      sources: {}
    }));
    
    // Add source breakdown to monthly data
    monthlyIncomeData.forEach(monthData => {
      const monthTransactions = recentIncome.filter(t => {
        const transactionMonth = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
        return transactionMonth === monthData.month;
      });
      
      monthTransactions.forEach(transaction => {
        monthData.sources[transaction.category] = (monthData.sources[transaction.category] || 0) + transaction.amount;
      });
    });
    
    res.json({
      sourceTotals,
      averageIncomeBySource,
      monthlyData: monthlyIncomeData,
      totalSources: Object.keys(sourceTotals).length
    });
  } catch (error) {
    console.error('Income analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching income analytics' });
  }
};

// Helper function to calculate trend direction
const calculateTrendDirection = (monthlyData) => {
  if (monthlyData.length < 2) return 'insufficient_data';
  
  const recentMonths = monthlyData.slice(-3); // Last 3 months
  const earlierMonths = monthlyData.slice(0, -3); // Earlier months
  
  if (earlierMonths.length === 0) return 'insufficient_data';
  
  const recentAvgExpenses = recentMonths.reduce((sum, month) => sum + month.expense, 0) / recentMonths.length;
  const earlierAvgExpenses = earlierMonths.reduce((sum, month) => sum + month.expense, 0) / earlierMonths.length;
  
  const changePercent = ((recentAvgExpenses - earlierAvgExpenses) / earlierAvgExpenses) * 100;
  
  if (changePercent > 10) return 'increasing';
  if (changePercent < -10) return 'decreasing';
  return 'stable';
};