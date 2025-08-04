import React from 'react';

const Step4TimeUnit = ({ data, onUpdate, onNext, onBack, currentStep, totalSteps }) => {
  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header - Top with space */}
      <div className="text-center pt-10 pb-4">
        <h1 className="text-white text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-white text-base">Time Unit Preference</p>
      </div>

      {/* Form - Centered with reduced spacing */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4">
        <div className="space-y-4">
          {/* Time Unit Selection */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div>
              <h3 className="text-white font-medium text-sm mb-2">Default Time Unit</h3>
              <p className="text-white/60 text-xs mb-2">
                This will be used as the default unit for all time tracking activities.
              </p>
              <div className="space-y-2">
                {[
                  { value: 'Hours', description: 'Track time in hours (e.g., 1.5 hours)' },
                  { value: 'Minutes', description: 'Track time in minutes (e.g., 90 minutes)' },
                  { value: 'Seconds', description: 'Track time in seconds (e.g., 5400 seconds)' }
                ].map((unit) => (
                  <label key={unit.value} className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors group">
                    <input
                      type="radio"
                      name="defaultTimeUnit"
                      value={unit.value}
                      checked={data.defaultTimeUnit === unit.value}
                      onChange={(e) => onUpdate('defaultTimeUnit', e.target.value)}
                      className="w-4 h-4 text-white bg-white/10 border border-white/20 focus:ring-white/40 mt-1"
                    />
                    <div>
                      <span className="text-white font-medium text-sm group-hover:text-blue-300 transition-colors duration-200">{unit.value}</span>
                      <p className="text-white/60 text-xs">{unit.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Account Button - Fixed at bottom */}
      <div className="p-6">
        <button
          onClick={onNext}
          className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export default Step4TimeUnit; 