import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/currency';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const BudgetChart = ({ budgetData, type = 'bar' }) => {
  // Default data if none provided
  const defaultData = [
    { category: 'Food & Dining', budgeted: 800, spent: 650, remaining: 150 },
    { category: 'Transportation', budgeted: 400, spent: 380, remaining: 20 },
    { category: 'Entertainment', budgeted: 300, spent: 420, remaining: -120 },
    { category: 'Shopping', budgeted: 500, spent: 280, remaining: 220 },
    { category: 'Bills & Utilities', budgeted: 1200, spent: 1150, remaining: 50 },
  ];

  const data = budgetData || defaultData;

  // Color palette for modern look
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6'
  };

  if (type === 'doughnut') {
    const doughnutData = {
      labels: data.map(item => item.category),
      datasets: [
        {
          label: 'Budget Spent',
          data: data.map(item => item.spent),
          backgroundColor: [
            colors.primary,
            colors.secondary,
            colors.warning,
            colors.danger,
            colors.purple,
            colors.pink,
            colors.indigo,
            colors.teal
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4,
        },
      ],
    };

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              size: 12,
              weight: '500'
            }
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        },
      },
      cutout: '60%',
      elements: {
        arc: {
          borderRadius: 4,
        }
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Budget Distribution</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Current Month</span>
          </div>
        </div>
        <div className="h-80">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    );
  }

  // Bar chart data
  const barData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        label: 'Budgeted',
        data: data.map(item => item.budgeted),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: colors.primary,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Spent',
        data: data.map(item => item.spent),
        backgroundColor: data.map(item => 
          item.spent > item.budgeted 
            ? 'rgba(239, 68, 68, 0.8)' 
            : 'rgba(16, 185, 129, 0.8)'
        ),
        borderColor: data.map(item => 
          item.spent > item.budgeted 
            ? colors.danger 
            : colors.secondary
        ),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '500'
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
          afterBody: function(context) {
            if (context.length > 0) {
              const dataIndex = context[0].dataIndex;
              const item = data[dataIndex];
              const remaining = item.budgeted - item.spent;
              const status = remaining >= 0 ? 'Under budget' : 'Over budget';
              return [`Remaining: ${formatCurrency(Math.abs(remaining))}`, status];
            }
            return [];
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            weight: '500'
          },
          color: '#6B7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
            weight: '500'
          },
          color: '#6B7280',
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
    },
    elements: {
      bar: {
        borderRadius: 6,
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Budget vs Spending</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Budgeted</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Spent</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <Bar data={barData} options={barOptions} />
      </div>
      
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Budgeted</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(data.reduce((sum, item) => sum + item.budgeted, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Spent</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(data.reduce((sum, item) => sum + item.spent, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Remaining</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(data.reduce((sum, item) => sum + (item.budgeted - item.spent), 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetChart;