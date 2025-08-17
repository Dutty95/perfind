import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, goalAPI } from '../utils/api';
import BudgetChart from '../components/charts/BudgetChart';
import ExpenseChart from '../components/charts/ExpenseChart';
import IncomeChart from '../components/charts/IncomeChart';
import { FullPageLoader, CardSkeleton, ChartSkeleton } from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  TrophyIcon,
  PlusIcon,
  EyeIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ChartPieIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    financialSummary: {
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      savingsRate: 0
    },
    recentTransactions: [],
    budgetOverview: [],
    goalProgress: [],
    insights: []
  });
  const [analyticsData, setAnalyticsData] = useState({
    expenses: null,
    income: null
  });
  const [goals, setGoals] = useState([]);
  const [activeChartType, setActiveChartType] = useState('budget');
  const [chartViewType, setChartViewType] = useState('pie');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch dashboard overview data with period filter
      const dashboardOverview = await dashboardAPI.getOverview({ period: selectedPeriod });
      
      if (dashboardOverview) {
        // Update user data if available
        if (dashboardOverview.user) {
          setUser(prevUser => ({ ...prevUser, ...dashboardOverview.user }));
        }
        
        // Map backend data structure to frontend expectations
        const mappedData = {
          financialSummary: dashboardOverview.financialSummary || {
            totalBalance: 0,
            monthlyIncome: 0,
            monthlyExpenses: 0,
            savingsRate: 0
          },
          recentTransactions: dashboardOverview.recentTransactions || [],
          budgetOverview: dashboardOverview.budgets || [],
          goalProgress: [],
          insights: dashboardOverview.insights || []
        };
        setDashboardData(mappedData);
      }

      // Fetch analytics data for charts with period filter
      const periodMonths = selectedPeriod === 'yearly' ? 12 : selectedPeriod === 'monthly' ? 6 : selectedPeriod === 'weekly' ? 1 : 1;
      const [expenseAnalytics, incomeAnalytics] = await Promise.all([
        dashboardAPI.getExpenseAnalytics({ months: periodMonths, period: selectedPeriod }),
        dashboardAPI.getIncomeAnalytics({ months: periodMonths, period: selectedPeriod })
      ]);

      setAnalyticsData({
        expenses: {
          monthlyData: expenseAnalytics?.monthlyData || [],
          categoryData: expenseAnalytics?.categoryData || [],
          averageSpendingByCategory: expenseAnalytics?.averageSpendingByCategory || []
        },
        income: {
          monthlyData: incomeAnalytics?.monthlyData || [],
          sourceTotals: incomeAnalytics?.sourceTotals || {},
          averageIncomeBySource: incomeAnalytics?.averageIncomeBySource || []
        }
      });

      // Fetch goals overview
      const goalsOverview = await goalAPI.getOverview();
      
      if (goalsOverview.success) {
        setGoals(goalsOverview.data.activeGoals || []);
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Using imported formatCurrency from utils

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getGoalProgress = (goal) => {
    return Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  };

  const getGoalStatus = (goal) => {
    const progress = getGoalProgress(goal);
    const isOverdue = new Date(goal.targetDate) < new Date();
    
    if (goal.type === 'save') {
      if (progress >= 100) return { status: 'completed', color: 'text-green-600', bgColor: 'bg-green-50' };
      if (isOverdue) return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-50' };
      if (progress >= 75) return { status: 'on-track', color: 'text-blue-600', bgColor: 'bg-blue-50' };
      return { status: 'behind', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      if (progress <= 70) return { status: 'achieved', color: 'text-green-600', bgColor: 'bg-green-50' };
      if (isOverdue) return { status: 'failed', color: 'text-red-600', bgColor: 'bg-red-50' };
      return { status: 'in-progress', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
  };

  const getBudgetProgress = (budget) => {
    return Math.min(Math.round(((budget.spent || 0) / budget.amount) * 100), 100);
  };

  const getBudgetColor = (budget) => {
    const progress = getBudgetProgress(budget);
    if (progress < 70) return 'text-green-600';
    if (progress < 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return <FullPageLoader text="Loading your financial dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-6 animate-slide-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600">Here's your financial overview</p>
            </div>
            
            {/* Period Selector */}
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                disabled={isLoading}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover animate-fade-in-scale">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                   <BanknotesIcon className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Balance</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.financialSummary.totalBalance)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover animate-fade-in-scale" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                   <ArrowTrendingUpIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Monthly Income</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.financialSummary.monthlyIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                   <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Monthly Expenses</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.financialSummary.monthlyExpenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                   <ChartBarIcon className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Savings Rate</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {dashboardData.financialSummary.savingsRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Visualization Section */}
        <div className="mb-8 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 card-hover">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-0">Financial Analytics</h2>
              
              {/* Chart Type Selector */}
              <div className="flex items-center space-x-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveChartType('budget')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeChartType === 'budget'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Budget
                  </button>
                  <button
                    onClick={() => setActiveChartType('expense')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeChartType === 'expense'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Expenses
                  </button>
                  <button
                    onClick={() => setActiveChartType('income')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeChartType === 'income'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Income
                  </button>
                </div>
                
                {/* Chart View Type Selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setChartViewType(activeChartType === 'income' ? 'doughnut' : 'pie')}
                    className={`p-1.5 rounded-md transition-colors ${
                      chartViewType === 'pie' || chartViewType === 'doughnut'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title={activeChartType === 'income' ? 'Doughnut Chart' : 'Pie Chart'}
                  >
                    <ChartPieIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setChartViewType('line')}
                    className={`p-1.5 rounded-md transition-colors ${
                      chartViewType === 'line'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Line Chart"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Chart Display */}
            <div className="transition-all duration-300">
              {activeChartType === 'budget' && (
                <BudgetChart 
                  type={chartViewType} 
                  budgetData={dashboardData.budgetOverview.map((budget, index) => ({
                    key: budget._id || budget.category || index,
                    category: budget.category,
                    budgeted: budget.amount,
                    spent: budget.spent || 0,
                    remaining: budget.remaining || (budget.amount - (budget.spent || 0))
                  }))}
                />
              )}
              {activeChartType === 'expense' && (
                <ExpenseChart 
                  type={chartViewType} 
                  expenseData={analyticsData.expenses?.monthlyData || []}
                />
              )}
              {activeChartType === 'income' && (
                <IncomeChart 
                  type={chartViewType} 
                  incomeData={analyticsData.income?.monthlyData || []}
                />
              )}
            </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Transactions & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link
                  to="/transactions"
                  className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-300 group animate-fade-in-scale"
                >
                  <PlusIcon className="h-5 w-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-blue-900">Add Transaction</span>
                </Link>
                <Link
                  to="/budget"
                  className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-300 group animate-fade-in-scale"
                  style={{ animationDelay: '0.1s' }}
                >
                  <ChartBarIcon className="h-5 w-5 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-green-900">Manage Budget</span>
                </Link>
                <Link
                  to="/goals"
                  className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-300 group animate-fade-in-scale"
                  style={{ animationDelay: '0.2s' }}
                >
                  <TrophyIcon className="h-5 w-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-purple-900">Set Goals</span>
                </Link>

              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Recent Transactions</h2>
                <Link
                  to="/transactions"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {dashboardData.recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transactions yet</p>
                    <Link
                      to="/transactions"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Add your first transaction
                    </Link>
                  </div>
                ) : (
                  dashboardData.recentTransactions.map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.category} • {formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Goals & Budget Overview */}
          <div className="space-y-6">
            {/* Goals Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover animate-slide-in-up" style={{ animationDelay: '0.7s' }}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Financial Goals</h2>
                <Link
                  to="/goals"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Manage →
                </Link>
              </div>
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center py-6">
                    <TrophyIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">No goals set</p>
                    <Link
                      to="/goals"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Set your first goal
                    </Link>
                  </div>
                ) : (
                  goals.slice(0, 2).map((goal) => {
                    const status = getGoalStatus(goal);
                    const progress = getGoalProgress(goal);
                    
                    return (
                      <div key={goal._id} className={`p-3 rounded-lg border ${status.bgColor}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                            <p className="text-xs text-gray-500">{goal.category}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color} bg-white`}>
                            {progress}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                          <span>{formatCurrency(goal.currentAmount)}</span>
                          <span>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              goal.type === 'save' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs font-medium ${status.color}`}>
                            {status.status.charAt(0).toUpperCase() + status.status.slice(1).replace('-', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <CalendarDaysIcon className="h-3 w-3 mr-1" />
                            {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'No date set'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Budget Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover animate-slide-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Budget Overview</h2>
                <Link
                  to="/budget"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.budgetOverview.length === 0 ? (
                  <div className="text-center py-6">
                    <ChartBarIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">No budgets created</p>
                    <Link
                      to="/budget"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Create your first budget
                    </Link>
                  </div>
                ) : (
                  dashboardData.budgetOverview.map((budget) => {
                    const progress = getBudgetProgress(budget);
                    const remaining = budget.amount - (budget.spent || 0);
                    
                    return (
                      <div key={budget._id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{budget.category}</p>
                            <p className="text-xs text-gray-500 capitalize">{budget.period}</p>
                          </div>
                          <span className={`text-xs font-medium ${getBudgetColor(budget)}`}>
                            {progress}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                          <span>Spent: {formatCurrency(budget.spent || 0)}</span>
                          <span>Budget: {formatCurrency(budget.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress < 70 ? 'bg-green-500' : progress < 90 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <p className={`text-xs font-medium ${
                          remaining >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {remaining >= 0 ? 'Remaining' : 'Over budget'}: {formatCurrency(Math.abs(remaining))}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;