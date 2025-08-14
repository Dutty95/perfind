// backend/controllers/goalController.js

import Goal from '../models/Goal.js';
import Transaction from '../models/Transaction.js';

// @desc    Get all goals for a user
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const { status, type, category } = req.query;
    const userId = req.user._id;
    
    let filter = { userId };
    
    // Apply filters if provided
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goals'
    });
  }
};

// @desc    Get a single goal by ID
// @route   GET /api/goals/:id
// @access  Private
export const getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUserId(req.params.id, req.user._id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    res.json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goal'
    });
  }
};

// @desc    Create a new goal
// @route   POST /api/goals
// @access  Private
export const createGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      targetAmount,
      targetDate,
      priority,
      isRecurring,
      recurringPeriod
    } = req.body;
    
    // Validation
    if (!title || !type || !category || !targetAmount || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, type, category, targetAmount, targetDate'
      });
    }
    
    if (targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be greater than 0'
      });
    }
    
    const targetDateObj = new Date(targetDate);
    if (targetDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Target date must be in the future'
      });
    }
    
    // Check for existing active goal with same category and type
    const existingGoal = await Goal.findOne({
      userId: req.user._id,
      category,
      type,
      status: 'active'
    });
    
    if (existingGoal) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${type} goal for ${category}. Complete or pause the existing goal first.`
      });
    }
    
    const goalData = {
      userId: req.user._id,
      title,
      description,
      type,
      category,
      targetAmount: parseFloat(targetAmount),
      targetDate: targetDateObj,
      priority: priority || 'medium',
      isRecurring: isRecurring || false
    };
    
    if (isRecurring && recurringPeriod) {
      goalData.recurringPeriod = recurringPeriod;
    }
    
    const goal = await Goal.create(goalData);
    
    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating goal'
    });
  }
};

// @desc    Update a goal
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUserId(req.params.id, req.user._id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    const {
      title,
      description,
      targetAmount,
      currentAmount,
      targetDate,
      status,
      priority
    } = req.body;
    
    // Update fields if provided
    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (targetAmount !== undefined) {
      if (targetAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Target amount must be greater than 0'
        });
      }
      goal.targetAmount = parseFloat(targetAmount);
    }
    if (currentAmount !== undefined) {
      if (currentAmount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Current amount cannot be negative'
        });
      }
      goal.currentAmount = parseFloat(currentAmount);
    }
    if (targetDate !== undefined) {
      const targetDateObj = new Date(targetDate);
      if (targetDateObj <= new Date() && status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Target date must be in the future for active goals'
        });
      }
      goal.targetDate = targetDateObj;
    }
    if (status !== undefined) goal.status = status;
    if (priority !== undefined) goal.priority = priority;
    
    // Auto-complete goal if target is reached
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
    }
    
    await goal.save();
    
    res.json({
      success: true,
      message: 'Goal updated successfully',
      data: goal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating goal'
    });
  }
};

// @desc    Update goal progress
// @route   PATCH /api/goals/:id/progress
// @access  Private
export const updateGoalProgress = async (req, res) => {
  try {
    const { amount, action = 'set' } = req.body;
    
    if (amount === undefined || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount (>= 0)'
      });
    }
    
    const goal = await Goal.findByIdAndUserId(req.params.id, req.user._id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    if (goal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update progress for inactive goals'
      });
    }
    
    let updatedGoal;
    if (action === 'add') {
      updatedGoal = await goal.addProgress(parseFloat(amount));
    } else {
      updatedGoal = await goal.updateProgress(parseFloat(amount));
    }
    
    res.json({
      success: true,
      message: 'Goal progress updated successfully',
      data: updatedGoal
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating goal progress'
    });
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUserId(req.params.id, req.user._id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    await Goal.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting goal'
    });
  }
};

// @desc    Get goal statistics
// @route   GET /api/goals/stats
// @access  Private
export const getGoalStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const goals = await Goal.find({ userId });
    
    const stats = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      paused: goals.filter(g => g.status === 'paused').length,
      cancelled: goals.filter(g => g.status === 'cancelled').length,
      overdue: goals.filter(g => g.goalStatus === 'overdue').length,
      totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      averageProgress: goals.length > 0 
        ? goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length 
        : 0,
      byType: {
        save: goals.filter(g => g.type === 'save').length,
        reduce: goals.filter(g => g.type === 'reduce').length,
        earn: goals.filter(g => g.type === 'earn').length,
        invest: goals.filter(g => g.type === 'invest').length
      },
      byPriority: {
        high: goals.filter(g => g.priority === 'high').length,
        medium: goals.filter(g => g.priority === 'medium').length,
        low: goals.filter(g => g.priority === 'low').length
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching goal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goal statistics'
    });
  }
};

// @desc    Get goals overview for dashboard
// @route   GET /api/goals/overview
// @access  Private
export const getGoalsOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get active goals with priority sorting
    const activeGoals = await Goal.findActiveByUserId(userId);
    
    // Get recent completed goals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCompletedGoals = await Goal.find({
      userId,
      status: 'completed',
      updatedAt: { $gte: thirtyDaysAgo }
    }).sort({ updatedAt: -1 }).limit(5);
    
    // Calculate progress insights
    const progressInsights = activeGoals.map(goal => ({
      id: goal._id,
      title: goal.title,
      category: goal.category,
      type: goal.type,
      progress: goal.progressPercentage,
      status: goal.goalStatus,
      daysRemaining: goal.daysRemaining,
      priority: goal.priority,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount: goal.remainingAmount
    }));
    
    res.json({
      success: true,
      data: {
        activeGoals: progressInsights,
        recentCompletedGoals,
        summary: {
          totalActive: activeGoals.length,
          recentlyCompleted: recentCompletedGoals.length,
          highPriorityGoals: activeGoals.filter(g => g.priority === 'high').length,
          overdueGoals: activeGoals.filter(g => g.goalStatus === 'overdue').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching goals overview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goals overview'
    });
  }
};