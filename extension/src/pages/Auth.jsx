import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Auth = () => {
  const { login, register, navigateTo } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    profession: 'Lawyer',
    gender: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return false;
    }

    if (!isLogin) {
      if (!formData.email || !formData.name) {
        setError('Email and name are required for registration');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      // Password validation
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors.join(', '));
        return false;
      }
    }

    return true;
  };

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 15) {
      errors.push('Password must be at least 15 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number (0-9)');
    }
    
    // Check for special character using string includes instead of regex
    const specialChars = '!@#$%^&*()_\-+={}\[\]|\\:;"\'<>?,./';
    const hasSpecialChar = specialChars.split('').some(char => password.includes(char));
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_-+={}[]|\\:;"\'<>?,./)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // For registered users - sign in and go to home page
        await login(formData.username, formData.password);
        navigateTo('popup'); // Go to home page
      } else {
        // For new users - start onboarding flow
        // Store the registration data and navigate to onboarding
        localStorage.setItem('pendingRegistration', JSON.stringify(formData));
        navigateTo('onboarding');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      username: '',
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      profession: 'Lawyer',
      gender: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-300">
            {isLogin ? 'Sign in to continue' : 'Join BillableAI today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
              placeholder={isLogin ? 'Enter username or email' : 'Choose a username'}
              required
            />
          </div>

          {/* Email (registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          )}

          {/* Name (registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Confirm Password (registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {/* Profession (registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Profession
              </label>
              <select
                name="profession"
                value={formData.profession}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-black focus:outline-none focus:border-blue-400 transition-colors"
              >
                <option value="Lawyer">Lawyer</option>
                <option value="Attorney">Attorney</option>
                <option value="Legal Professional">Legal Professional</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Gender (registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-black focus:outline-none focus:border-blue-400 transition-colors"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-300 hover:text-blue-200 text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        {/* Password Requirements (registration only) */}
        {!isLogin && (
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <h3 className="text-blue-200 font-medium mb-2">Password Requirements:</h3>
                         <ul className="text-blue-100 text-sm space-y-1">
               <li>• At least 15 characters long</li>
               <li>• Contains uppercase letter (A-Z)</li>
               <li>• Contains lowercase letter (a-z)</li>
               <li>• Contains number (0-9)</li>
               <li>• Contains special character (!@#$%^&*()_-+={}[]|\\:;"&apos;&lt;&gt;?,./)</li>
             </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth; 