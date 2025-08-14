import React, { useState, useEffect } from 'react';
import { goalAPI } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import {
  TrophyIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'save',
    category: '',
    targetAmount: '',
    targetDate: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchGoals();
    fetchStats();
  }, [filter]);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await goalAPI.getAll(params);
      
      if (response.success) {
        setGoals(response.data);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await goalAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      const goalData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount)
      };

      let response;
      if (editingGoal) {
        response = await goalAPI.update(editingGoal._id, goalData);
      } else {
        response = await goalAPI.create(goalData);
      }

      if (response.success) {
        setShowModal(false);
        setEditingGoal(null);
        setFormData({
          title: '',
          description: '',
          type: 'save',
          category: '',
          targetAmount: '',
          targetDate: '',
          priority: 'medium'
        });
        fetchGoals();
        fetchStats();
      }
    } catch (err) {
      console.error('Error saving goal:', err);
      setError(err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      type: goal.type,
      category: goal.category,
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate.split('T')[0],
      priority: goal.priority
    });
    setShowModal(true);
  };

  const handleDelete = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        const response = await goalAPI.delete(goalId);
        if (response.success) {
          fetchGoals();
          fetchStats();
        }
      } catch (err) {
        console.error('Error deleting goal:', err);
        setError('Failed to delete goal');
      }
    }
  };

  const handleProgressUpdate = async (goalId, amount, action = 'set') => {
    try {
      const response = await goalAPI.updateProgress(goalId, { amount, action });
      if (response.success) {
        fetchGoals();
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress');
    }
  };

  const handleStatusUpdate = async (goalId, status) => {
    try {
      const response = await goalAPI.update(goalId, { status });
      if (response.success) {
        fetchGoals();
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating goal status:', err);
      setError('Failed to update goal status');
    }
  };

  const [progressInputs, setProgressInputs] = useState({});

  const handleProgressInputChange = (goalId, value) => {
    setProgressInputs(prev => ({
      ...prev,
      [goalId]: value
    }));
  };

  const handleAddProgress = async (goalId) => {
    const amount = parseFloat(progressInputs[goalId]);
    if (amount && amount > 0) {
      await handleProgressUpdate(goalId, amount, 'add');
      setProgressInputs(prev => ({
        ...prev,
        [goalId]: ''
      }));
    }
  };

  // Using imported formatCurrency from utils

  const getGoalStatusColor = (goal) => {
    switch (goal.goalStatus) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'on-track': return 'text-blue-600 bg-blue-50';
      case 'behind': return 'text-yellow-600 bg-yellow-50';
      case 'at-risk': return 'text-orange-600 bg-orange-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getGoalIcon = (type) => {
    switch (type) {
      case 'save': return <TrophyIcon className="h-5 w-5" />;
      case 'reduce': return <ChartBarIcon className="h-5 w-5" />;
      case 'earn': return <FireIcon className="h-5 w-5" />;
      case 'invest': return <ChartBarIcon className="h-5 w-5" />;
      default: return <TrophyIcon className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
              <p className="text-gray-600 mt-1">Track and achieve your financial objectives</p>
            </div>
            <button
              onClick={() => {
                setEditingGoal(null);
                setFormData({
                  title: '',
                  description: '',
                  type: 'save',
                  category: '',
                  targetAmount: '',
                  targetDate: '',
                  priority: 'medium'
                });
                setShowModal(true);
              }}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrophyIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Goals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageProgress.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          {['all', 'active', 'completed', 'paused'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === filterOption
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No goals found</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' ? 'Start by creating your first financial goal' : `No ${filter} goals found`}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Goal
              </button>
            </div>
          ) : (
            filteredGoals.map((goal) => (
              <div key={goal._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getGoalStatusColor(goal)}`}>
                      {getGoalIcon(goal.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-500">{goal.category}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getGoalStatusColor(goal)}`}>
                      {goal.goalStatus.charAt(0).toUpperCase() + goal.goalStatus.slice(1).replace('-', ' ')}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                      {goal.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{goal.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          goal.progressPercentage >= 100 
                            ? (goal.type === 'save' ? 'bg-green-500' : 'bg-green-500')
                            : (goal.type === 'save' ? 'bg-blue-500' : 'bg-green-500')
                        }`}
                        style={{ 
                          width: `${Math.min(goal.progressPercentage, 100)}%`,
                          ...(goal.progressPercentage >= 100 && {
                            boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
                            animation: 'pulse 2s infinite'
                          })
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-500">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      <span>{new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                    <span className={`font-medium ${
                      goal.daysRemaining < 0 ? 'text-red-600' : 
                      goal.daysRemaining < 30 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {goal.daysRemaining < 0 ? 'Overdue' : `${goal.daysRemaining} days left`}
                    </span>
                  </div>

                  {/* Progress Input Section */}
                  {goal.status === 'active' && (
                    <div className="border-t pt-3 space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Add progress amount"
                          value={progressInputs[goal._id] || ''}
                          onChange={(e) => handleProgressInputChange(goal._id, e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleAddProgress(goal._id)}
                          disabled={!progressInputs[goal._id] || parseFloat(progressInputs[goal._id]) <= 0}
                          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(goal._id, 'completed')}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center justify-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Complete
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(goal._id, 'paused')}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors flex items-center justify-center"
                        >
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Pause
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resume button for paused goals */}
                  {goal.status === 'paused' && (
                    <div className="border-t pt-3">
                      <button
                        onClick={() => handleStatusUpdate(goal._id, 'active')}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center"
                      >
                        <FireIcon className="h-4 w-4 mr-1" />
                        Resume Goal
                      </button>
                    </div>
                  )}

                  {goal.description && (
                    <p className="text-sm text-gray-600 border-t pt-3">{goal.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-full overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="save">Save</option>
                    <option value="reduce">Reduce</option>
                    <option value="earn">Earn</option>
                    <option value="invest">Invest</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Emergency Fund, Vacation, Debt Reduction"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingGoal(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;