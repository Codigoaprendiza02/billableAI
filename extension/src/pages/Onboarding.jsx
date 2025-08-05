import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import Step1SignUp from '../onboarding/Step1SignUp';
import Step1SignIn from '../onboarding/Step1SignIn';
import Step1BasicInfo from '../onboarding/Step1BasicInfo';
import Step2AIPreferences from '../onboarding/Step2AIPreferences';
import Step3BillableLogging from '../onboarding/Step3BillableLogging';
import Step4TimeUnit from '../onboarding/Step4TimeUnit';
import Step5Completion from '../onboarding/Step5Completion';

const Onboarding = () => {
  const { 
    navigateTo, 
    completeOnboarding, 
    login, 
    formData, 
    setFormData, 
    authMode, 
    setAuthMode,
    updateFormData,
    onboardingError,
    setOnboardingError
  } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  // Check if user is coming from registration
  useEffect(() => {
    const pendingRegistration = localStorage.getItem('pendingRegistration');
    if (pendingRegistration) {
      const registrationData = JSON.parse(pendingRegistration);
      setFormData(prev => ({
        ...prev,
        name: registrationData.name || '',
        profession: registrationData.profession || 'Lawyer',
        gender: registrationData.gender || ''
      }));
      localStorage.removeItem('pendingRegistration');
    }
  }, [setFormData]);

  // Handle onboarding errors
  useEffect(() => {
    if (onboardingError) {
      setError(onboardingError);
      setCurrentStep(1); // Go back to signup step
      setAuthMode('signup');
      setOnboardingError(''); // Clear the error after setting it
    }
  }, [onboardingError, setOnboardingError, setAuthMode]);

  // Check if user is already authenticated and has completed onboarding
  useEffect(() => {
    const checkAuthStatus = () => {
      const authToken = localStorage.getItem('billableai_auth_token');
      const userData = localStorage.getItem('billableai_user_data');
      const onboardingCompleted = localStorage.getItem('billableai_onboarding_completed') === 'true';
      
      if (authToken && userData && onboardingCompleted) {
        // User is authenticated and has completed onboarding, navigate to popup
        navigateTo('popup');
      }
    };
    
    checkAuthStatus();
  }, [navigateTo]);

  // Determine total steps based on auth mode
  const getTotalSteps = () => {
    return authMode === 'signup' ? 6 : 1; // Changed from 5 to 6 to include Step5Completion
  };

  const totalSteps = getTotalSteps();

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError(''); // Clear error when moving to next step
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(''); // Clear error when going back
    }
  };

  const handleComplete = async () => {
    setError(''); // Clear any previous errors
    
    try {
      // Complete onboarding with all form data
      await completeOnboarding(formData);
      navigateTo('popup');
    } catch (error) {
      setError(error.message);
      // Stay on the current step so user can see the error
    }
  };

  const handleSignIn = async (username, password) => {
    setError(''); // Clear any previous errors
    
    try {
      await login(username, password);
      navigateTo('popup');
    } catch (error) {
      console.error('Sign in failed:', error);
      setError(error.message);
    }
  };

  // Progress circles component
  const ProgressCircles = () => {
    if (authMode === 'signin' || currentStep === 6) return null; // Hide for signin and final step
    
    return (
      <div className="flex justify-center items-center space-x-2 mb-4">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              index + 1 === currentStep
                ? 'bg-blue-400'
                : index + 1 < currentStep
                ? 'bg-green-400'
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    );
  };

  // Navigation arrows component with circles and hover effects
  const NavigationArrows = ({ onNext, onBack, showBack = true, showNext = true }) => {
    // Don't show navigation for the final step
    if (currentStep === 6) return null;
    
    return (
      <div className="flex justify-between items-center mt-4">
        {showBack && currentStep > 1 && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all duration-200"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {showNext && currentStep < totalSteps && (
          <button
            onClick={onNext}
            className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all duration-200 ml-auto"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  const renderStep = () => {
    
    switch (currentStep) {
      case 1:
        return authMode === 'signup' ? (
          <Step1SignUp
            data={formData}
            onUpdate={updateFormData}
            onNext={handleNext}
            currentStep={currentStep}
            totalSteps={totalSteps}
            error={error}
          />
        ) : (
          <Step1SignIn
            data={formData}
            onUpdate={updateFormData}
            onNext={handleSignIn}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        );
      case 2:
        return (
          <Step1BasicInfo
            data={formData}
            onUpdate={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        );
      case 3:
        return (
          <Step2AIPreferences
            data={formData}
            onUpdate={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        );
      case 4:
        return (
          <Step3BillableLogging
            data={formData}
            onUpdate={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        );
      case 5:
        return (
          <Step4TimeUnit
            data={formData}
            onUpdate={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        );
      case 6:
        return (
          <Step5Completion
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-96 h-[600px] bg-gradient-to-br from-black via-blue-900 to-purple-600 flex flex-col overflow-hidden">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mx-4 mt-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="transition-all duration-300 ease-in-out min-h-full">
          {renderStep()}
        </div>
      </div>
      
      {/* Progress and Navigation - Fixed at Bottom */}
      <div className="p-4 border-t border-white/10">
        <ProgressCircles />
        <NavigationArrows 
          onNext={handleNext} 
          onBack={handleBack}
          showBack={currentStep > 1}
          showNext={currentStep < totalSteps && currentStep !== 5}
        />
      </div>
    </div>
  );
};

export default Onboarding; 