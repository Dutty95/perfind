import React from 'react';
import { Navigate } from 'react-router-dom';
import { getValidToken, isAuthenticated } from '../utils/tokenManager';

const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated using the token manager
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;