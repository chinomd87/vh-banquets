import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import PropTypes from 'prop-types';

const AuthWrapper = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [loginMode, setLoginMode] = useState('login');

  const handleToggleMode = () => {
    setLoginMode(prev => prev === 'login' ? 'register' : 'login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginForm 
        mode={loginMode}
        onToggleMode={handleToggleMode}
      />
    );
  }

  return children;
};

AuthWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthWrapper;
