import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/currency';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const ExpenseChart = ({ expenseData, type = 'line', timeframe = 'monthly' }) => {
  // Default data if none provided
  const defaultMonthlyData = [
    { month: 'Jan', amount: 2800, categories: { food: 800, transport: 400, entertainment: 300, shopping: 500, bills: 800 } },
    { month: 'Feb', amount: 3200, categories: { food: 850, transport: 450, entertainment: 400, shopping: 600, bills: 900 } },
    { month: 'Mar', amount: 2900, categories: { food: 780, transport: 420, entertainment: 350, shopping: 550, bills: 800 } },
    { month: 'Apr', amount: 3400, categories: { food: 900, transport: 480, entertainment: 450, shopping: 700, bills: 870 } },
    { month: 'May', amount: 3100, categories: { food: 820, transport: 460, entertainment: 380, shopping: 620, bills: 820 } },
    { month: 'Jun', amount: 3300, categories: { food: 880, transport: 500, entertainment: 420, shopping: 650, bills: 850 } },
  ];

  const defaultWeeklyData = [
    { week: 'Week 1', amount: 750 },
    { week: 'Week 2', amount: 820 },
    { week: 'Week 3', amount: 680 },
    { week: 'Week 4', amount: 950 },
  ];

  const data = expenseData || (timeframe === 'weekly' ? defaultWeeklyData : defaultMonthlyData);

  // Color palette
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
    orange: '#F97316',
    cyan: '#06B6D4'
  };

  // Pie chart for category breakdown
  if (type === 'pie') {
    const latestData = data[data.length - 1];
    const categories = latestData.categories || {
      food: latestData.amount * 0.3,
      transport: latestData.amount * 0.15,
      entertainment: latestData.amount * 0.12,
      shopping: latestData.amount * 0.18,
      bills: latestData.amount * 0.25
    };

    const pieData = {
      labels: Object.keys(categories).map(key => 
        key.charAt(0).toUpperCase() + key.slice(1)
      ),
      datasets: [
        {
          label: 'Expense Categories',
          data: Object.values(categories),
          backgroundColor: [
            colors.primary,
            colors.secondary,
            colors.warning,
            colors.danger,
            colors.purple,
            colors.pink,
            colors.indigo,
            colors.teal,
            colors.orange,
            colors.cyan
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4,
        },
      ],
    };

    const pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
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
      elements: {
        arc: {
          borderRadius: 4,
        }
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Current Month</span>
          </div>
        </div>
        <div className="h-80">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>
    );
  }

  // Bar chart for category comparison
  if (type === 'bar') {
    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills'];
    const categoryData = categories.map(category => {
      const key = category.toLowerCase();
      return data.reduce((sum, item) => {
        const categoryAmount = item.categories?.[key] || item.amount * (key === 'food' ? 0.3 : key === 'bills' ? 0.25 : key === 'shopping' ? 0.18 : key === 'transport' ? 0.15 : 0.12);
        return sum + categoryAmount;
      }, 0) / data.length;
    });

    const barData = {
      labels: categories,
      datasets: [
        {
          label: 'Average Monthly Spending',
          data: categoryData,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderColor: [
            colors.primary,
            colors.secondary,
            colors.warning,
            colors.danger,
            colors.purple
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };

    const barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
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
              return `Average: ${formatCurrency(context.parsed.y)}`;
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
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Average Spending by Category</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            <span className="text-sm text-gray-600">6 Month Average</span>
          </div>
        </div>
        <div className="h-80">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    );
  }

  // Line chart for expense trends
  const lineData = {
    labels: data.map(item => item.month || item.week),
    datasets: [
      {
        label: 'Total Expenses',
        data: data.map(item => item.amount),
        borderColor: colors.danger,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.danger,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
            return `Expenses: ${formatCurrency(context.parsed.y)}`;
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
            return '$' + value.toLocaleString();
          }
        }
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: colors.danger,
      }
    }
  };

  // Calculate trend
  const currentAmount = data[data.length - 1]?.amount || 0;
  const previousAmount = data[data.length - 2]?.amount || 0;
  const trend = currentAmount - previousAmount;
  const trendPercentage = previousAmount ? ((trend / previousAmount) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Expense Trends</h3>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            trend >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            <svg className={`w-4 h-4 ${
              trend >= 0 ? 'rotate-0' : 'rotate-180'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
            <span className="text-sm font-medium">
              {Math.abs(trendPercentage)}% {trend >= 0 ? 'increase' : 'decrease'}
            </span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <Line data={lineData} options={lineOptions} />
      </div>
      
      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">This Month</p>
              <p className="text-2xl font-bold text-red-900">
                ${formatCurrency(currentAmount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Average</p>
              <p className="text-2xl font-bold text-blue-900">
                ${formatCurrency(Math.round(data.reduce((sum, item) => sum + item.amount, 0) / data.length))}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Highest</p>
              <p className="text-2xl font-bold text-purple-900">
                ${formatCurrency(Math.max(...data.map(item => item.amount)))}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;