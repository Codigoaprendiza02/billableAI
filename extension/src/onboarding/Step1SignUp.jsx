import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const Step1SignUp = ({ data, onUpdate, onNext, currentStep, totalSteps, error }) => {
  const [formData, setFormData] = useState({
    email: data.email || '',
    username: data.username || '',
    password: data.password || '',
    confirmPassword: data.confirmPassword || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update local errors when error prop changes
  React.useEffect(() => {
    if (error) {
      setErrors({ submit: error });
    }
  }, [error]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 15) {
      newErrors.password = 'Password must be at least 15 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (@$!%*?&)';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Make API call immediately when Create Account is clicked
      const registrationPayload = {
        email: formData.email,
        name: data.name || 'User',
        profession: data.profession || 'Lawyer',
        gender: data.gender || 'Male',
        username: formData.username,
        password: formData.password
      };
      
      // Call the registration API
      const response = await authAPI.register(registrationPayload);
      
      // If successful, store the token and user data
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      // Update form data with registration info
      onUpdate('registrationData', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        token: response.token,
        user: response.user
      });
      
      // Proceed to next step
      onNext();
    } catch (error) {
      // Handle API errors
      let userMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('Email already registered')) {
        userMessage = 'This email is already registered. Please use a different email or try signing in.';
      } else if (error.message.includes('Username already exists')) {
        userMessage = 'This username is already taken. Please choose a different username.';
      } else if (error.message.includes('Invalid credentials')) {
        userMessage = 'Invalid username or password. Please check your credentials.';
      } else if (error.message.includes('User not found')) {
        userMessage = 'User not found. Please check your username or email.';
      } else if (error.message.includes('Missing')) {
        userMessage = error.message;
      }
      
      setErrors({ submit: userMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 overflow-y-auto">
        <div className="text-center mb-6 ">
          <h2 className="text-white text-2xl text-center font-semibold mb-2">Create Your Account</h2>
        </div>

        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.email
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-white/20 bg-white/10 text-white placeholder-white/50'
              } focus:outline-none focus:border-blue-400`}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.username
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-white/20 bg-white/10 text-white placeholder-white/50'
              } focus:outline-none focus:border-blue-400`}
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="text-red-400 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-colors pr-12 ${
                  errors.password
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-white/20 bg-white/10 text-white placeholder-white/50'
                } focus:outline-none focus:border-blue-400`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-colors pr-12 ${
                  errors.confirmPassword
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-white/20 bg-white/10 text-white placeholder-white/50'
                } focus:outline-none focus:border-blue-400`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white text-sm font-medium mb-2">Password Requirements:</h4>
            <ul className="text-white/70 text-xs space-y-1">
              <li className={`flex items-center ${formData.password.length >= 15 ? 'text-green-400' : ''}`}>
                <span className="mr-2">•</span>
                At least 15 characters
              </li>
              <li className={`flex items-center ${/(?=.*[a-z])/.test(formData.password) ? 'text-green-400' : ''}`}>
                <span className="mr-2">•</span>
                One lowercase letter
              </li>
              <li className={`flex items-center ${/(?=.*[A-Z])/.test(formData.password) ? 'text-green-400' : ''}`}>
                <span className="mr-2">•</span>
                One uppercase letter
              </li>
              <li className={`flex items-center ${/(?=.*\d)/.test(formData.password) ? 'text-green-400' : ''}`}>
                <span className="mr-2">•</span>
                One number
              </li>
              <li className={`flex items-center ${/(?=.*[@$!%*?&])/.test(formData.password) ? 'text-green-400' : ''}`}>
                <span className="mr-2">•</span>
                One special character (@$!%*?&)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Display - Above the Create Account button */}
      {errors.submit && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3">
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full max-w-xs py-3 px-6 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        <button
          onClick={() => onUpdate('authMode', 'signin')}
          className="w-full text-white/70 text-sm hover:text-white transition-colors"
        >
          Already have an account? Sign In
        </button>
      </div>
    </div>
  );
};

export default Step1SignUp; 