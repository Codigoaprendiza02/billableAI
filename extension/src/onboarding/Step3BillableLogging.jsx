import React from 'react';
import ToggleSwitch from '../components/ToggleSwitch';

const Step3BillableLogging = ({ data, onUpdate, onNext, onBack, currentStep, totalSteps }) => {
  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header - Top with space */}
      <div className="text-center pt-12 pb-8">
        <h1 className="text-white text-2xl font-bold mb-3">Create Account</h1>
        <p className="text-white text-base">Billable Logging Preferences</p>
      </div>

      {/* Form - Centered with proper spacing */}
      <div className="flex-1 flex flex-col justify-center px-8 py-8">
        <div className="space-y-8">
          {/* Confirmation Before Logging */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-sm mb-3">Confirmation Before Logging</h3>
                <p className="text-white/60 text-xs">
                  Ask for confirmation before automatically logging time
                </p>
              </div>
              <ToggleSwitch
                checked={data.confirmationBeforeLogging}
                onChange={(checked) => onUpdate('confirmationBeforeLogging', checked)}
              />
            </div>
          </div>

          {/* Confirmation Before Attaching */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-sm mb-3">Confirmation Before Attaching to Clio</h3>
                <p className="text-white/60 text-xs">
                  Ask for confirmation before attaching summaries to Clio cases
                </p>
              </div>
              <ToggleSwitch
                checked={data.confirmationBeforeAttaching}
                onChange={(checked) => onUpdate('confirmationBeforeAttaching', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3BillableLogging; 