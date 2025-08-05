import React from 'react';

const Step1BasicInfo = ({ data, onUpdate, onNext, currentStep, totalSteps }) => {
  const isFormValid = data.name.trim() && data.gender && data.profession.trim();

  const handleNext = () => {
    if (isFormValid) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header - Top with space */}
      <div className="text-center pt-12 pb-8">
        <h1 className="text-white text-2xl font-bold mb-3">Create Account</h1>
        <p className="text-white text-base">Basic Information</p>
      </div>

      {/* Centered Content - Takes remaining space */}
      <div className="flex-1 border-solid border-whiteflex flex-col justify-center px-8 py-8">
        <div className="space-y-8">
          {/* Name Input */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">
              Enter Your name
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              className="w-full bg-white/20 backdrop-blur-sm rounded-lg px-4 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="Type your name......"
            />
          </div>

          {/* Profession Input */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">
              Enter Your Profession
            </label>
            <input
              type="text"
              value={data.profession}
              onChange={(e) => onUpdate('profession', e.target.value)}
              className="w-full bg-white/20 backdrop-blur-sm rounded-lg px-4 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="Type your profession......"
            />
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-white text-sm font-medium mb-4">
              What is your gender?
            </label>
            <div className="flex space-x-10">
              {['Male', 'Female', 'Others'].map((gender) => (
                <label key={gender} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value={gender}
                    checked={data.gender === gender}
                    onChange={(e) => onUpdate('gender', e.target.value)}
                    className="w-4 h-4 text-white bg-white/10 border border-white/20 focus:ring-white/40"
                  />
                  <span className="text-white text-sm group-hover:text-blue-300 transition-colors duration-200">{gender}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1BasicInfo; 