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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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

const IncomeChart = ({ incomeData, type = 'line', timeframe = 'monthly' }) => {
  // Default data if none provided
  const defaultMonthlyData = [
    { month: 'Jan', amount: 5200, sources: { salary: 4500, freelance: 500, investments: 200 } },
    { month: 'Feb', amount: 5800, sources: { salary: 4500, freelance: 1000, investments: 300 } },
    { month: 'Mar', amount: 5400, sources: { salary: 4500, freelance: 700, investments: 200 } },
    { month: 'Apr', amount: 6200, sources: { salary: 4500, freelance: 1400, investments: 300 } },
    { month: 'May', amount: 5900, sources: { salary: 4500, freelance: 1200, investments: 200 } },
    { month: 'Jun', amount: 6500, sources: { salary: 4500, freelance: 1700, investments: 300 } },
  ];

  const defaultWeeklyData = [
    { week: 'Week 1', amount: 1300 },
    { week: 'Week 2', amount: 1450 },
    { week: 'Week 3', amount: 1200 },
    { week: 'Week 4', amount: 1650 },
  ];

  const data = incomeData || (timeframe === 'weekly' ? defaultWeeklyData : defaultMonthlyData);

  // Color palette
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    success: '#22C55E',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
    orange: '#F97316',
    cyan: '#06B6D4'
  };

  // Doughnut chart for income sources
  if (type === 'doughnut') {
    const latestData = data[data.length - 1];
    const sources = latestData.sources || {
      salary: latestData.amount * 0.75,
      freelance: latestData.amount * 0.20,
      investments: latestData.amount * 0.05
    };

    const doughnutData = {
      labels: Object.keys(sources).map(key => 
        key.charAt(0).toUpperCase() + key.slice(1)
      ),
      datasets: [
        {
          label: 'Income Sources',
          data: Object.values(sources),
          backgroundColor: [
            colors.secondary,
            colors.primary,
            colors.warning,
            colors.purple,
            colors.teal,
            colors.pink
          ],
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverBorderWidth: 6,
          cutout: '60%',
        },
      ],
    };

    const doughnutOptions = {
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
          borderRadius: 6,
        }
      }
    };

    const totalIncome = Object.values(sources).reduce((a, b) => a + b, 0);

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Income Sources</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Current Month</span>
          </div>
        </div>
        <div className="relative h-80">
          <Doughnut data={doughnutData} options={doughnutOptions} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bar chart for income comparison
  if (type === 'bar') {
    const sources = ['Salary', 'Freelance', 'Investments'];
    const sourceData = sources.map(source => {
      const key = source.toLowerCase();
      return data.reduce((sum, item) => {
        const sourceAmount = item.sources?.[key] || item.amount * (key === 'salary' ? 0.75 : key === 'freelance' ? 0.20 : 0.05);
        return sum + sourceAmount;
      }, 0) / data.length;
    });

    const barData = {
      labels: sources,
      datasets: [
        {
          label: 'Average Monthly Income',
          data: sourceData,
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: [
            colors.secondary,
            colors.primary,
            colors.warning
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
          <h3 className="text-lg font-semibold text-gray-900">Average Income by Source</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-full"></div>
            <span className="text-sm text-gray-600">6 Month Average</span>
          </div>
        </div>
        <div className="h-80">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    );
  }

  // Line chart for income trends
  const lineData = {
    labels: data.map(item => item.month || item.week),
    datasets: [
      {
        label: 'Total Income',
        data: data.map(item => item.amount),
        borderColor: colors.secondary,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.secondary,
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
            return `Income: ${formatCurrency(context.parsed.y)}`;
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
        hoverBackgroundColor: colors.secondary,
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
        <h3 className="text-lg font-semibold text-gray-900">Income Trends</h3>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <svg className={`w-4 h-4 ${
              trend >= 0 ? 'rotate-0' : 'rotate-180'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l9.2 9.2M17 7v10H7" />
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
      
      {/* Income Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">This Month</p>
              <p className="text-2xl font-bold text-green-900">
                ${formatCurrency(currentAmount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
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

export default IncomeChart;