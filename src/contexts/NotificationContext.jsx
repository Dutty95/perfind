import React, { createContext, useContext, useState, useEffect } from 'react';
import { goalAPI, authenticatedApiRequest } from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkGoalDeadlines = async () => {
    try {
      const response = await goalAPI.getAll();
      const goals = response.data || [];
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      
      const upcomingDeadlines = goals.filter(goal => {
        if (goal.status === 'completed' || goal.status === 'paused') return false;
        const targetDate = new Date(goal.targetDate);
        return targetDate <= threeDaysFromNow && targetDate > now;
      });

      const deadlineNotifications = upcomingDeadlines.map(goal => {
        const targetDate = new Date(goal.targetDate);
        const daysLeft = Math.ceil((targetDate - now) / (24 * 60 * 60 * 1000));
        
        return {
          id: `goal-deadline-${goal.id}`,
          type: 'deadline',
          title: 'Goal Deadline Approaching',
          message: `Your goal "${goal.title}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
          goalId: goal.id,
          createdAt: new Date(),
          read: false
        };
      });

      // Check for goal achievements and behind schedule
      const goalStatusNotifications = goals.map(goal => {
        const progress = goal.currentAmount / goal.targetAmount * 100;
        const targetDate = new Date(goal.targetDate);
        const timeLeft = targetDate - now;
        const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
        
        // Goal achieved
        if (progress >= 100 && goal.status !== 'completed') {
          return {
            id: `goal-achieved-${goal.id}`,
            type: 'success',
            title: 'Goal Achieved! 🎉',
            message: `Congratulations! You've achieved your goal "${goal.title}".`,
            goalId: goal.id,
            createdAt: new Date(),
            read: false
          };
        }
        
        // Behind schedule (less than 50% progress with less than 50% time remaining)
        const totalDays = Math.ceil((targetDate - new Date(goal.createdAt)) / (24 * 60 * 60 * 1000));
        const timeProgress = ((totalDays - daysLeft) / totalDays) * 100;
        
        if (progress < 50 && timeProgress > 50 && daysLeft > 0 && goal.status === 'active') {
          return {
            id: `goal-behind-${goal.id}`,
            type: 'warning',
            title: 'Goal Behind Schedule',
            message: `You're behind on your goal "${goal.title}". Consider increasing your efforts.`,
            goalId: goal.id,
            createdAt: new Date(),
            read: false
          };
        }
        
        return null;
      }).filter(Boolean);

      // Remove old notifications for the same goals
      setNotifications(prev => {
        const filtered = prev.filter(notif => 
          (notif.type !== 'deadline' && notif.type !== 'success' && notif.type !== 'warning') || 
          (!upcomingDeadlines.some(goal => notif.goalId === goal.id) && 
           !goalStatusNotifications.some(notif2 => notif2.goalId === notif.goalId))
        );
        return [...filtered, ...deadlineNotifications, ...goalStatusNotifications];
      });

    } catch (error) {
      console.error('Error checking goal deadlines:', error);
    }
  };

  const checkBudgetStatus = async () => {
    try {
      const budgetsResponse = await authenticatedApiRequest('/api/budgets');
      const budgets = budgetsResponse.data || budgetsResponse || [];
      const transactionsResponse = await authenticatedApiRequest('/api/transactions?limit=1000');
      const transactions = transactionsResponse.data || [];
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const budgetNotifications = budgets.map(budget => {
        // Calculate current month spending for this category
        const monthlyExpenses = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === 'expense' && 
                 t.category === budget.category &&
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        });
        
        const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
        const percentage = (totalSpent / budget.amount) * 100;
        
        // Budget exceeded
        if (percentage > 100) {
          return {
            id: `budget-exceeded-${budget._id}`,
            type: 'error',
            title: 'Budget Exceeded! ⚠️',
            message: `You've exceeded your ${budget.category} budget by ${(percentage - 100).toFixed(1)}%.`,
            budgetId: budget._id,
            createdAt: new Date(),
            read: false
          };
        }
        
        // Budget warning (80% reached)
        if (percentage > 80 && percentage <= 100) {
          return {
            id: `budget-warning-${budget._id}`,
            type: 'warning',
            title: 'Budget Warning',
            message: `You've used ${percentage.toFixed(1)}% of your ${budget.category} budget.`,
            budgetId: budget._id,
            createdAt: new Date(),
            read: false
          };
        }
        
        return null;
      }).filter(Boolean);
      
      // Check if expenses exceed income
      const monthlyIncome = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'income' &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      }).reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyExpenses = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      }).reduce((sum, t) => sum + t.amount, 0);
      
      if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) {
        budgetNotifications.push({
          id: `expenses-exceed-income-${currentMonth}-${currentYear}`,
          type: 'error',
          title: 'Expenses Exceed Income! 🚨',
          message: `Your monthly expenses (₦${monthlyExpenses.toLocaleString()}) exceed your income (₦${monthlyIncome.toLocaleString()}).`,
          createdAt: new Date(),
          read: false
        });
      }
      
      // Remove old budget notifications
      setNotifications(prev => {
        const filtered = prev.filter(notif => 
          (notif.type !== 'error' && notif.type !== 'warning') ||
          !budgetNotifications.some(newNotif => newNotif.id === notif.id)
        );
        return [...filtered, ...budgetNotifications];
      });
      
    } catch (error) {
      console.error('Error checking budget status:', error);
    }
  };

  const sendDailyReminder = () => {
    const lastReminder = localStorage.getItem('lastDailyReminder');
    const today = new Date().toDateString();
    
    if (lastReminder !== today) {
      addNotification({
        type: 'info',
        title: 'Daily Financial Check-in 📊',
        message: 'Don\'t forget to track your expenses and check your progress towards your financial goals!'
      });
      
      localStorage.setItem('lastDailyReminder', today);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Update unread count whenever notifications change
  useEffect(() => {
    const unread = notifications.filter(notif => !notif.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Check for goal deadlines, budget status, and send daily reminders
  useEffect(() => {
    const runChecks = async () => {
      try {
        await checkGoalDeadlines();
        await checkBudgetStatus();
        sendDailyReminder();
      } catch (error) {
        console.error('Error running notification checks:', error);
      }
    };
    
    runChecks();
    
    // Check goals and budgets every hour
    const interval = setInterval(async () => {
      try {
        await checkGoalDeadlines();
        await checkBudgetStatus();
      } catch (error) {
        console.error('Error in periodic notification checks:', error);
      }
    }, 60 * 60 * 1000);
    
    // Send daily reminder every 24 hours
    const dailyInterval = setInterval(() => {
      try {
        sendDailyReminder();
      } catch (error) {
        console.error('Error sending daily reminder:', error);
      }
    }, 24 * 60 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(dailyInterval);
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
    checkGoalDeadlines,
    checkBudgetStatus,
    sendDailyReminder
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;