import React from 'react';
import { useAppContext } from '../context/AppContext';
import TimerIcon from '../icons/TimerIcon';

const AssistantNavComponent = () => {
  const { navigateTo } = useAppContext();

  return (
    <div className="text-center space-y-4">
      <h2 className="text-white text-lg font-semibold mb-4">
        Welcome to BillableAI!
      </h2>
      
      {/* Email Tracking Button */}
      <button
        onClick={() => navigateTo('email-tracking')}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
      >
        <TimerIcon className="w-5 h-5" />
        <span>Email Tracking</span>
      </button>
      
      {/* AI Assistant Button */}
      <button
        onClick={() => navigateTo('assistant')}
        className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
      >
        <span>🤖</span>
        <span>AI Assistant</span>
      </button>
    </div>
  );
};

export default AssistantNavComponent; 