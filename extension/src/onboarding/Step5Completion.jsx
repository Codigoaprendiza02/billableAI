import React from 'react';

const Step5Completion = ({ onComplete }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] w-full">
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        <div className="flex flex-col items-center justify-center mt-12 mb-8">
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-32 h-32 rounded-full bg-white/20" style={{filter: 'blur(2px)'}}></div>
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white border-2 border-[#bfc2f7] z-10">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#23244a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 13 11 18 18 7" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-white text-2xl font-medium mb-2 font-bold">Setup Complete!</h1>
            <p className="text-white text-l font-medium">You are all set to start billable AI!</p>
          </div>
        </div>
        <button
          onClick={onComplete}
          className="px-10 py-4 text-l font-semibold rounded-xl text-black bg-white hover:bg-gray-100 hover:text-[#3432c7] transition-all duration-200 shadow-lg focus:outline-none"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Step5Completion; 