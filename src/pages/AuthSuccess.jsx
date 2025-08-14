import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store the access token with consistent key
      localStorage.setItem('accessToken', token);
      
      // Fetch user profile to get complete user data using the API utility
      import('../utils/api.js').then(({ authAPI }) => {
        return authAPI.getProfile();
      })
      .then(userData => {
        if (userData._id) {
          // Store user data with consistent key
          localStorage.setItem('userData', JSON.stringify({
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar
          }));
          
          // Initialize token refresh mechanism
          import('../utils/tokenManager.js').then(({ initializeTokenRefresh }) => {
            initializeTokenRefresh();
          });
          
          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('Failed to fetch user data');
        }
      })
      .catch(error => {
        console.error('Auth success error:', error);
        navigate('/login', { 
          replace: true,
          state: { error: 'Authentication failed. Please try again.' }
        });
      });
    } else {
      // No token provided, redirect to login
      navigate('/login', { 
        replace: true,
        state: { error: 'Authentication failed. No token received.' }
      });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              Completing sign in...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we set up your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;