import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChartBarIcon, TrophyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { budgetAPI, goalAPI, transactionAPI } from '../utils/api';
import { formatCurrency } from '../utils/currency';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [activeTab, setActiveTab] = useState('budgets');
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    goal: '',
    goalType: 'save',
    targetDate: ''
  });
  const [expenseInputs, setExpenseInputs] = useState({});
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    fetchBudgets();
    fetchGoals();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await budgetAPI.getAll();
      const budgetData = response.data || response;
      console.log('Fetched budgets:', budgetData);
      setBudgets(budgetData);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await goalAPI.getAll();
      if (response.success) {
        setGoals(response.data);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      await budgetAPI.create({
        category: formData.category,
        amount: formData.amount,
        period: formData.period
      });
      setShowAddModal(false);
      setFormData({ category: '', amount: '', period: 'monthly', goal: '', goalType: 'save', targetDate: '' });
      fetchBudgets();
    } catch (err) {
      console.error('Error creating budget:', err);
      setError('Failed to create budget');
    }
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    const newGoal = {
      id: Date.now(),
      title: formData.goal,
      target: parseFloat(formData.amount),
      current: 0,
      targetDate: formData.targetDate,
      type: formData.goalType,
      category: formData.category
    };
    setGoals(prev => [...prev, newGoal]);
    setShowGoalModal(false);
    setFormData({ category: '', amount: '', period: 'monthly', goal: '', goalType: 'save', targetDate: '' });
  };

  const handleEditBudget = async (e) => {
    e.preventDefault();
    try {
      await budgetAPI.update(editingBudget._id, {
        category: formData.category,
        amount: formData.amount,
        period: formData.period
      });
      setShowEditModal(false);
      setEditingBudget(null);
      setFormData({ category: '', amount: '', period: 'monthly', goal: '', goalType: 'save', targetDate: '' });
      fetchBudgets();
    } catch (err) {
      console.error('Error updating budget:', err);
      setError('Failed to update budget');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    console.log('Delete function called with budgetId:', budgetId, 'Type:', typeof budgetId);
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        console.log('Attempting to delete budget:', budgetId);
        const response = await budgetAPI.delete(budgetId);
        console.log('Delete response:', response);
        fetchBudgets();
      } catch (err) {
        console.error('Error deleting budget:', err);
        console.error('Error details:', err.message);
        setError('Failed to delete budget: ' + err.message);
      }
    }
  };

  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    }
  };

  const handleExpenseInputChange = (budgetId, value) => {
    setExpenseInputs(prev => ({
      ...prev,
      [budgetId]: value
    }));
  };

  const handleAddExpense = async (budgetId) => {
    const amount = parseFloat(expenseInputs[budgetId]);
    if (amount && amount > 0) {
      try {
        // Find the budget to get its category
        const budget = budgets.find(b => b._id === budgetId);
        if (!budget) {
          setError('Budget not found');
          return;
        }

        // Create a transaction instead of directly adding to budget
        await transactionAPI.create({
          type: 'expense',
          amount: amount,
          category: budget.category,
          description: `Budget expense - ${budget.category}`,
          date: new Date().toISOString().split('T')[0]
        });
        
        setExpenseInputs(prev => ({
          ...prev,
          [budgetId]: ''
        }));
        fetchBudgets();
      } catch (err) {
        console.error('Error adding expense:', err);
        setError('Failed to add expense');
      }
    }
  };

  const openExpenseModal = (budget) => {
    setSelectedBudget(budget);
    setShowExpenseModal(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(expenseInputs[selectedBudget._id]);
    if (amount && amount > 0) {
      await handleAddExpense(selectedBudget._id);
      setShowExpenseModal(false);
      setSelectedBudget(null);
    }
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period || 'monthly',
      goal: '',
      goalType: 'save',
      targetDate: ''
    });
    setShowEditModal(true);
  };

  // Using imported formatCurrency from utils

  const calculateProgress = (current, target) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getProgressColor = (current, target, type = 'budget') => {
    const percentage = (current / target) * 100;
    if (type === 'reduce') {
      // For reduction goals, lower is better
      if (percentage <= 70) return 'bg-green-500';
      if (percentage <= 90) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    // For savings goals and budgets
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGoalStatus = (goal) => {
    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
    const isOverdue = new Date(goal.targetDate) < new Date();
    
    if (goal.type === 'save') {
      if (progress >= 100) return { status: 'completed', icon: '🎉', color: 'text-green-600' };
      if (isOverdue) return { status: 'overdue', icon: '⚠️', color: 'text-red-600' };
      if (progress >= 75) return { status: 'on-track', icon: '📈', color: 'text-blue-600' };
      return { status: 'behind', icon: '📊', color: 'text-yellow-600' };
    } else {
      if (progress <= 70) return { status: 'achieved', icon: '🎯', color: 'text-green-600' };
      if (isOverdue) return { status: 'failed', icon: '❌', color: 'text-red-600' };
      return { status: 'in-progress', icon: '⏳', color: 'text-yellow-600' };
    }
  };

  const renderBudgetCard = (budget) => {
    console.log('Rendering budget card for:', budget);
    return (
      <div key={budget._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{budget.category}</h3>
          <p className="text-sm text-gray-500 capitalize">{budget.period} budget</p>
        </div>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <button
            onClick={() => openEditModal(budget)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteBudget(budget._id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Spent</span>
          <span className="font-medium">{formatCurrency(budget.spent || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Budget</span>
          <span className="font-medium">{formatCurrency(budget.amount)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className={`font-medium ${(budget.remaining || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(budget.remaining || (budget.amount - (budget.spent || 0)))}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs font-medium text-gray-700">
              {calculateProgress(budget.spent || 0, budget.amount)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getProgressColor(budget.spent || 0, budget.amount)
              }`}
              style={{ width: `${Math.min(calculateProgress(budget.spent || 0, budget.amount), 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Expense Input Section */}
        <div className="border-t pt-3 mt-4">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Add expense amount"
              value={expenseInputs[budget._id] || ''}
              onChange={(e) => handleExpenseInputChange(budget._id, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleAddExpense(budget._id)}
              disabled={!expenseInputs[budget._id] || parseFloat(expenseInputs[budget._id]) <= 0}
              className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Add Expense
            </button>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderGoalCard = (goal) => {
    const status = getGoalStatus(goal);
    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
    
    return (
      <div key={goal._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
              <span className={`text-lg ${status.color}`}>{status.icon}</span>
            </div>
            <p className="text-sm text-gray-500">{goal.category} • Due: {new Date(goal.targetDate).toLocaleDateString()}</p>
            <p className={`text-xs font-medium mt-1 ${status.color}`}>
              {status.status.charAt(0).toUpperCase() + status.status.slice(1).replace('-', ' ')}
            </p>
          </div>
          <button
            onClick={() => handleDeleteGoal(goal._id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors mt-2 sm:mt-0"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Current</span>
            <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Target</span>
            <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {goal.type === 'save' ? 'Remaining' : 'Over Target'}
            </span>
            <span className={`font-medium ${
              goal.type === 'save' 
                ? (goal.targetAmount - goal.currentAmount >= 0 ? 'text-blue-600' : 'text-green-600')
                : (goal.currentAmount - goal.targetAmount <= 0 ? 'text-green-600' : 'text-red-600')
            }`}>
              {goal.type === 'save' 
                ? formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))
                : formatCurrency(Math.max(0, goal.currentAmount - goal.targetAmount))
              }
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getProgressColor(goal.current, goal.target, goal.type)
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Budget & Goals</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Budget
            </button>
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <TrophyIcon className="h-4 w-4 mr-2" />
              Add Goal
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'budgets' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('budgets')}
          >
            💰 Budgets
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'goals' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('goals')}
          >
            🎯 Goals
          </button>
        </div>

        {/* Budget Summary */}
        {activeTab === 'budgets' && (
          <div className="bg-white shadow-sm rounded-lg mb-6 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Monthly Budget Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Budgeted</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  {budgets.length > 0 ? formatCurrency(budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0)) : formatCurrency(0)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Total Spent</p>
                <p className="text-xl sm:text-2xl font-bold text-red-900">
                  {budgets.length > 0 ? formatCurrency(budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0)) : formatCurrency(0)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total Remaining</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">
                  {budgets.length > 0 ? formatCurrency(budgets.reduce((sum, budget) => sum + (budget.remaining || (budget.amount - (budget.spent || 0))), 0)) : formatCurrency(0)}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Content */}
        {activeTab === 'budgets' ? (
          <div>
            {budgets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No budgets</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first budget.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Budget
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {budgets.map(renderBudgetCard)}
              </div>
            )}
          </div>
        ) : (
          <div>
            {goals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No goals</h3>
                <p className="mt-1 text-sm text-gray-500">Set your first financial goal to start tracking progress.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <TrophyIcon className="h-4 w-4 mr-2" />
                    Add Goal
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {goals.map(renderGoalCard)}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-full overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Budget</h3>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="Food">Food</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  name="period"
                  value={formData.period}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Budget
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-full overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                <select
                  name="goalType"
                  value={formData.goalType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="save">Save Money</option>
                  <option value="reduce">Reduce Spending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="Savings">Savings</option>
                  <option value="Food">Food</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  name="targetDate"
                  value={formData.targetDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Goal
                </button>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-full overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Budget</h3>
            <form onSubmit={handleEditBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Food">Food</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  name="period"
                  value={formData.period}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update Budget
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;