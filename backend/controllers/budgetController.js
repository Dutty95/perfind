// backend/controllers/budgetController.js

import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';

// Get all budgets for the authenticated user
const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });
    
    // Calculate spent amounts for each budget by analyzing transactions
    const budgetsWithSpending = await Promise.all(budgets.map(async budget => {
      const allTransactions = await Transaction.findByUserId(req.user._id);
      const categoryTransactions = allTransactions.filter(transaction => 
        transaction.category === budget.category && transaction.type === 'expense'
      );
      
      // Calculate total spent in this category for the current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const monthlySpent = categoryTransactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((total, transaction) => total + transaction.amount, 0);
      
      const remaining = budget.amount - monthlySpent;
      const percentage = budget.amount > 0 ? Math.round((monthlySpent / budget.amount) * 100) : 0;
      
      // Convert Mongoose document to plain object and add calculated fields
      const budgetObj = budget.toObject();
      return {
        ...budgetObj,
        spent: monthlySpent,
        remaining: remaining,
        percentage: Math.min(percentage, 100)
      };
    }));
    
    res.json(budgetsWithSpending);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Server error while fetching budgets' });
  }
};

// Get single budget by ID
const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Server error while fetching budget' });
  }
};

// Create new budget
const createBudget = async (req, res) => {
  try {
    const { category, amount, period } = req.body;
    
    // Validation
    if (!category || !amount || amount <= 0) {
      return res.status(400).json({ 
        message: 'Category and valid amount are required' 
      });
    }
    
    // Check if budget already exists for this category and user
    const existingBudget = await Budget.find({ 
      userId: req.user._id, 
      category: category 
    });
    
    if (existingBudget.length > 0) {
      return res.status(400).json({ 
        message: 'Budget already exists for this category' 
      });
    }
    
    // Calculate end date based on period
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    switch (period || 'monthly') {
      case 'weekly':
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(startDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(startDate.getMonth() + 1);
    }
    
    const budgetData = {
      userId: req.user._id,
      category,
      amount: parseFloat(amount),
      period: period || 'monthly',
      startDate,
      endDate
    };
    
    const budget = await Budget.create(budgetData);
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ message: 'Server error while creating budget' });
  }
};

// Update budget
const updateBudget = async (req, res) => {
  try {
    const { category, amount, period } = req.body;
    
    // Validation
    if (amount && amount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be greater than 0' 
      });
    }
    
    // First check if budget exists and belongs to user
    const existingBudget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!existingBudget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    const updateData = {};
    if (category) updateData.category = category;
    if (amount) updateData.amount = parseFloat(amount);
    if (period) updateData.period = period;
    
    const budget = await Budget.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    res.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Server error while updating budget' });
  }
};

// Delete budget
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    await Budget.findByIdAndDelete(req.params.id);
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Server error while deleting budget' });
  }
};

// Get budget overview/statistics
const getBudgetOverview = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });
    const transactions = await Transaction.find({ userId: req.user._id, type: 'expense' });
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate monthly spending by category
    const monthlySpending = {};
    transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .forEach(transaction => {
        monthlySpending[transaction.category] = 
          (monthlySpending[transaction.category] || 0) + transaction.amount;
      });
    
    // Calculate budget vs actual for each category
    const budgetAnalysis = budgets.map(budget => {
      const spent = monthlySpending[budget.category] || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        category: budget.category,
        budgeted: budget.amount,
        spent: spent,
        remaining: remaining,
        percentage: Math.round(percentage),
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      };
    });
    
    // Calculate totals
    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = Object.values(monthlySpending).reduce((sum, amount) => sum + amount, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    
    const overview = {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      budgetAnalysis,
      monthlySpending
    };
    
    res.json(overview);
  } catch (error) {
    console.error('Error fetching budget overview:', error);
    res.status(500).json({ message: 'Server error while fetching budget overview' });
  }
};

export {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetOverview
};