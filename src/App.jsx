import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Import your page components
import Welcome from './components/Welcome';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Forgetpassword from './pages/Forgetpassword';
import AuthSuccess from './pages/AuthSuccess';
import AuthError from './pages/AuthError';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Goals from './pages/Goals';

import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Import layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './routes/ProtectedRoute';
import { initializeTokenRefresh, fetchCsrfToken } from './utils/tokenManager';
import { NotificationProvider } from './contexts/NotificationContext';

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Animated page wrapper
const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

// Layout wrapper for protected routes
const ProtectedLayout = ({ children }) => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <AnimatedPage>{children}</AnimatedPage>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

// App routes component
function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<AnimatedPage><Welcome /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
        <Route path="/forgot-password" element={<AnimatedPage><Forgetpassword /></AnimatedPage>} />
        
        {/* OAuth Routes */}
        <Route path="/auth/success" element={<AnimatedPage><AuthSuccess /></AnimatedPage>} />
        <Route path="/auth/error" element={<AnimatedPage><AuthError /></AnimatedPage>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />
        <Route path="/budget" element={<ProtectedLayout><Budget /></ProtectedLayout>} />
        <Route path="/goals" element={<ProtectedLayout><Goals /></ProtectedLayout>} />
        
        <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
        
        {/* Redirects and 404 */}
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    initializeTokenRefresh();
    
    // Initialize CSRF token
    fetchCsrfToken().catch(error => {
      console.error('Failed to initialize CSRF token:', error);
    });
    
    // Initialize theme on app load
    const savedTheme = localStorage.getItem('theme') || 'light';
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
    
    applyTheme(savedTheme);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <NotificationProvider>
          <div className="App min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </NotificationProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;