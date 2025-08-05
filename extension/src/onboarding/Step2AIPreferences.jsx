import React from 'react';

const Step2AIPreferences = ({ data, onUpdate, onNext, onBack, currentStep, totalSteps }) => {
  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header - Top with space */}
      <div className="text-center pt-12 pb-8">
        <h1 className="text-white text-2xl font-bold mb-3">Create Account</h1>
        <p className="text-white text-base">AI assistant Preferences</p>
      </div>

      {/* Form - Centered with proper spacing */}
      <div className="flex-1 flex flex-col justify-center px-8 py-6">
        <div className="bg-white/10 backdrop-blur-sm border-2 border-solid border-white/30 rounded-lg p-6 space-y-8">
          {/* Email Auto-suggestions */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">Email Auto Suggestions</h3>
            <div className="flex space-x-8">
              {['Yes', 'No'].map((option) => (
                <label key={option} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="emailAutoSuggestions"
                    value={option}
                    checked={data.emailAutoSuggestions === option}
                    onChange={(e) => onUpdate('emailAutoSuggestions', e.target.value)}
                    className="w-4 h-4 text-white bg-white/10 border border-white/20 focus:ring-white/40"
                  />
                  <span className="text-white text-sm group-hover:text-blue-300 transition-colors duration-200">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Default Tone */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">Default Email Tone</h3>
            <div className="flex space-x-8">
              {['Formal', 'Casual'].map((option) => (
                <label key={option} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="defaultTone"
                    value={option}
                    checked={data.defaultTone === option}
                    onChange={(e) => onUpdate('defaultTone', e.target.value)}
                    className="w-4 h-4 text-white bg-white/10 border border-white/20 focus:ring-white/40"
                  />
                  <span className="text-white text-sm group-hover:text-blue-300 transition-colors duration-200">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2AIPreferences; 