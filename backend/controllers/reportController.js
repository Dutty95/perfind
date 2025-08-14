// backend/controllers/reportController.js

import Report from '../models/Report.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';

// Helper function to calculate date ranges
const getDateRange = (period, customStart = null, customEnd = null) => {
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek));
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case 'custom':
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      break;
    default:
      throw new Error('Invalid period specified');
  }
  
  return { startDate, endDate };
};

// Helper function to generate insights
const generateInsights = (data, summary) => {
  const insights = [];
  
  // Spending insights
  if (summary.totalExpenses > summary.totalIncome) {
    insights.push({
      type: 'warning',
      message: `You spent $${(summary.totalExpenses - summary.totalIncome).toFixed(2)} more than you earned this period.`,
      category: 'spending',
      priority: 'high'
    });
  }
  
  // Savings rate insights
  if (summary.savingsRate < 10) {
    insights.push({
      type: 'recommendation',
      message: 'Consider increasing your savings rate to at least 10% of your income.',
      category: 'savings',
      priority: 'medium'
    });
  } else if (summary.savingsRate >= 20) {
    insights.push({
      type: 'success',
      message: `Excellent! You're saving ${summary.savingsRate.toFixed(1)}% of your income.`,
      category: 'savings',
      priority: 'low'
    });
  }
  
  // Budget utilization insights
  if (summary.budgetUtilization > 90) {
    insights.push({
      type: 'warning',
      message: 'You\'ve used over 90% of your budget. Consider reviewing your spending.',
      category: 'budget',
      priority: 'high'
    });
  }
  
  // Goal progress insights
  if (summary.goalProgress < 25) {
    insights.push({
      type: 'info',
      message: 'Your goal progress is below 25%. Consider reviewing your goals and action plans.',
      category: 'goals',
      priority: 'medium'
    });
  }
  
  return insights;
};

// @desc    Generate a new report
// @route   POST /api/reports/generate
// @access  Private
export const generateReport = async (req, res) => {
  try {
    const {
      title,
      type = 'comprehensive',
      period = 'monthly',
      startDate: customStart,
      endDate: customEnd,
      categories = [],
      isScheduled = false,
      scheduleFrequency
    } = req.body;
    
    const userId = req.user._id;
    
    // Calculate date range
    const { startDate, endDate } = getDateRange(period, customStart, customEnd);
    
    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }
    
    // Fetch data based on report type
    let reportData = {};
    let summary = {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      budgetUtilization: 0,
      goalProgress: 0,
      savingsRate: 0
    };
    
    // Get transactions for the period
    const transactionFilter = {
      userId,
      date: { $gte: startDate, $lt: endDate }
    };
    
    if (categories.length > 0) {
      transactionFilter.category = { $in: categories };
    }
    
    const transactions = await Transaction.find(transactionFilter).sort({ date: -1 });
    
    // Calculate income and expenses
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    summary.totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    summary.totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    summary.netIncome = summary.totalIncome - summary.totalExpenses;
    summary.savingsRate = summary.totalIncome > 0 
      ? ((summary.netIncome / summary.totalIncome) * 100) 
      : 0;
    
    // Get category breakdown
    const categoryBreakdown = {};
    expenses.forEach(transaction => {
      const category = transaction.category;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = 0;
      }
      categoryBreakdown[category] += transaction.amount;
    });
    
    reportData.transactions = {
      total: transactions.length,
      income: income.length,
      expenses: expenses.length,
      categoryBreakdown,
      recentTransactions: transactions.slice(0, 10)
    };
    
    // Get budget data if relevant
    if (type === 'budget' || type === 'comprehensive') {
      const budgets = await Budget.find({ userId });
      let totalBudgeted = 0;
      let totalSpent = 0;
      
      const budgetAnalysis = await Promise.all(budgets.map(async (budget) => {
        const budgetExpenses = expenses.filter(t => t.category === budget.category);
        const spent = budgetExpenses.reduce((sum, t) => sum + t.amount, 0);
        totalBudgeted += budget.amount;
        totalSpent += spent;
        
        return {
          category: budget.category,
          budgeted: budget.amount,
          spent,
          remaining: budget.amount - spent,
          utilization: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        };
      }));
      
      summary.budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
      
      reportData.budgets = {
        total: budgets.length,
        totalBudgeted,
        totalSpent,
        analysis: budgetAnalysis
      };
    }
    
    // Get goal data if relevant
    if (type === 'goal' || type === 'comprehensive') {
      const goals = await Goal.find({ userId });
      const activeGoals = goals.filter(g => g.status === 'active');
      const completedGoals = goals.filter(g => g.status === 'completed');
      
      const avgProgress = activeGoals.length > 0 
        ? activeGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / activeGoals.length 
        : 0;
      
      summary.goalProgress = avgProgress;
      
      reportData.goals = {
        total: goals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        averageProgress: avgProgress,
        recentGoals: goals.slice(0, 5)
      };
    }
    
    // Generate insights
    const insights = generateInsights(reportData, summary);
    
    // Create report
    const reportTitle = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${period}`;
    
    const reportDoc = {
      userId,
      title: reportTitle,
      type,
      period,
      startDate,
      endDate,
      categories,
      data: reportData,
      summary,
      insights,
      isScheduled,
      scheduleFrequency: isScheduled ? scheduleFrequency : undefined,
      nextGenerationDate: isScheduled ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined // 30 days from now
    };
    
    const report = await Report.create(reportDoc);
    
    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating report'
    });
  }
};

// @desc    Get all reports for a user
// @route   GET /api/reports
// @access  Private
export const getReports = async (req, res) => {
  try {
    const { type, period, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    
    const skip = (page - 1) * limit;
    
    const reports = await Report.findByUserId(userId, {
      type,
      period,
      limit: parseInt(limit),
      skip
    });
    
    const total = await Report.countDocuments({ userId });
    
    res.json({
      success: true,
      count: reports.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports'
    });
  }
};

// @desc    Get a single report by ID
// @route   GET /api/reports/:id
// @access  Private
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findByIdAndUserId(req.params.id, req.user._id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report'
    });
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUserId(req.params.id, req.user._id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    await Report.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting report'
    });
  }
};

// @desc    Get report templates/presets
// @route   GET /api/reports/templates
// @access  Private
export const getReportTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 'monthly-overview',
        title: 'Monthly Financial Overview',
        type: 'comprehensive',
        period: 'monthly',
        description: 'Complete overview of income, expenses, budgets, and goals for the current month'
      },
      {
        id: 'expense-analysis',
        title: 'Expense Analysis',
        type: 'expense',
        period: 'monthly',
        description: 'Detailed breakdown of expenses by category and trends'
      },
      {
        id: 'budget-performance',
        title: 'Budget Performance Report',
        type: 'budget',
        period: 'monthly',
        description: 'Analysis of budget vs actual spending across all categories'
      },
      {
        id: 'goal-progress',
        title: 'Goal Progress Report',
        type: 'goal',
        period: 'quarterly',
        description: 'Progress tracking for all active financial goals'
      },
      {
        id: 'yearly-summary',
        title: 'Annual Financial Summary',
        type: 'comprehensive',
        period: 'yearly',
        description: 'Comprehensive yearly review of financial performance'
      }
    ];
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report templates'
    });
  }
};

// @desc    Get quick financial summary
// @route   GET /api/reports/summary
// @access  Private
export const getQuickSummary = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const userId = req.user._id;
    
    const { startDate, endDate } = getDateRange(period);
    
    // Get transactions for the period
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lt: endDate }
    });
    
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;
    
    // Get top spending categories
    const categorySpending = {};
    expenses.forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });
    
    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
    
    res.json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalIncome,
          totalExpenses,
          netIncome,
          savingsRate,
          transactionCount: transactions.length
        },
        topCategories
      }
    });
  } catch (error) {
    console.error('Error generating quick summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating summary'
    });
  }
};