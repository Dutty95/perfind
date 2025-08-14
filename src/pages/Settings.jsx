import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { authenticatedApiRequest } from '../utils/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('preferences');
  const [preferences, setPreferences] = useState({
    currency: 'NGN',
    theme: 'light',
    notifications: true,
    emailAlerts: true,
    twoFactorAuth: false
  });
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Apply theme changes to document
  useEffect(() => {
    const applyTheme = (theme) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyTheme(preferences.theme);
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', preferences.theme);
  }, [preferences.theme]);

  // Load saved preferences on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedCurrency = localStorage.getItem('currency') || 'NGN';
    const savedNotifications = localStorage.getItem('notifications') !== 'false';
    
    setPreferences(prev => ({
      ...prev,
      theme: savedTheme,
      currency: savedCurrency,
      notifications: savedNotifications
    }));
  }, []);

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setPreferences(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Save to localStorage immediately for certain preferences
    if (name === 'currency') {
      localStorage.setItem('currency', value);
    } else if (name === 'notifications') {
      localStorage.setItem('notifications', checked.toString());
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Save preferences to localStorage
      Object.keys(preferences).forEach(key => {
        localStorage.setItem(key, preferences[key].toString());
      });
      
      setSuccess('Settings saved successfully!');
      
      addNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Your preferences have been saved successfully.'
      });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save your preferences. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (dataType = 'all') => {
    setLoading(true);
    
    try {
      let data = {};
      let filename = '';
      
      if (dataType === 'all') {
        // Fetch all user data
        const [transactionsRes, budgetsRes, goalsRes] = await Promise.all([
          authenticatedApiRequest('/api/transactions?limit=1000'),
          authenticatedApiRequest('/api/budgets'),
          authenticatedApiRequest('/api/goals')
        ]);

        data = {
          transactions: transactionsRes.data || [],
          budgets: budgetsRes.data || budgetsRes || [],
          goals: goalsRes.data || goalsRes || [],
          exportDate: new Date().toISOString(),
          currency: preferences.currency
        };
        filename = `financial-data-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (dataType === 'transactions') {
        const transactionsRes = await authenticatedApiRequest('/api/transactions?limit=1000');
        data = {
          transactions: transactionsRes.data || [],
          exportDate: new Date().toISOString(),
          currency: preferences.currency
        };
        filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (dataType === 'budgets') {
        const budgetsRes = await authenticatedApiRequest('/api/budgets');
        data = {
          budgets: budgetsRes.data || budgetsRes || [],
          exportDate: new Date().toISOString(),
          currency: preferences.currency
        };
        filename = `budgets-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (dataType === 'goals') {
        const goalsRes = await authenticatedApiRequest('/api/goals');
        data = {
          goals: goalsRes.data || goalsRes || [],
          exportDate: new Date().toISOString(),
          currency: preferences.currency
        };
        filename = `goals-${new Date().toISOString().split('T')[0]}.csv`;
      }

      // Convert to CSV format
      const csvContent = convertToCSV(data);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `Your ${dataType === 'all' ? 'financial' : dataType} data has been exported successfully.`
      });
      
    } catch (error) {
      console.error('Error exporting data:', error);
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export your data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    let csv = '';
    
    // Transactions CSV
    if (data.transactions.length > 0) {
      csv += 'TRANSACTIONS\n';
      csv += 'Date,Description,Amount,Category,Type\n';
      data.transactions.forEach(t => {
        csv += `${t.date},"${t.description}",${t.amount},${t.category},${t.type}\n`;
      });
      csv += '\n';
    }
    
    // Budgets CSV
    if (data.budgets.length > 0) {
      csv += 'BUDGETS\n';
      csv += 'Category,Amount,Period,Start Date,End Date\n';
      data.budgets.forEach(b => {
        csv += `${b.category},${b.amount},${b.period},${b.startDate},${b.endDate}\n`;
      });
      csv += '\n';
    }
    
    // Goals CSV
    if (data.goals.length > 0) {
      csv += 'GOALS\n';
      csv += 'Title,Target Amount,Current Amount,Target Date,Status\n';
      data.goals.forEach(g => {
        csv += `"${g.title}",${g.targetAmount},${g.currentAmount},${g.targetDate},${g.status}\n`;
      });
    }
    
    return csv;
  };

  const renderPreferencesTab = () => {
    return (
      <form onSubmit={handleSavePreferences}>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">General Preferences</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Customize your experience with the application.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
              <select
                id="currency"
                name="currency"
                value={preferences.currency}
                onChange={handlePreferenceChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="NGN">NGN - Nigerian Naira</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
              <select
                id="theme"
                name="theme"
                value={preferences.theme}
                onChange={handlePreferenceChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mt-8">Notifications</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Decide how you want to be notified.</p>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="notifications"
                    name="notifications"
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={handlePreferenceChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="notifications" className="font-medium text-gray-700 dark:text-gray-300">App Notifications</label>
                  <p className="text-gray-500 dark:text-gray-400">Receive notifications within the app.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="emailAlerts"
                    name="emailAlerts"
                    type="checkbox"
                    checked={preferences.emailAlerts}
                    onChange={handlePreferenceChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="emailAlerts" className="font-medium text-gray-700 dark:text-gray-300">Email Alerts</label>
                  <p className="text-gray-500 dark:text-gray-400">Receive email notifications for important updates.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mt-8">Security</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enhance your account security.</p>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="twoFactorAuth"
                    name="twoFactorAuth"
                    type="checkbox"
                    checked={preferences.twoFactorAuth}
                    onChange={handlePreferenceChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="twoFactorAuth" className="font-medium text-gray-700 dark:text-gray-300">Two-Factor Authentication</label>
                  <p className="text-gray-500 dark:text-gray-400">Add an extra layer of security to your account.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </form>
    );
  };

  const renderDataTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Data Management</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account data and exports.</p>
        </div>
        
        <div className="bg-white shadow sm:rounded-lg dark:bg-slate-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Export Your Data</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>Download your financial data in CSV format. Choose what data to export:</p>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleExportData('all')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700 dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    'Export All Data'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => handleExportData('transactions')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Transactions
                </button>
                
                <button
                  type="button"
                  onClick={() => handleExportData('budgets')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Budgets
                </button>
                
                <button
                  type="button"
                  onClick={() => handleExportData('goals')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Goals
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Account</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Permanently delete your account and all associated data.</p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
          
          {success && (
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}
          
          <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg">
            <div className="border-b border-gray-200 dark:border-slate-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`${activeTab === 'preferences' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Preferences
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`${activeTab === 'data' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Data & Privacy
                </button>
              </nav>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              {activeTab === 'preferences' ? renderPreferencesTab() : renderDataTab()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;