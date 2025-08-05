import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import SettingsIcon from '../icons/SettingsIcon';
import ToggleSwitch from '../components/ToggleSwitch';

const USER_PROFILE_SVG = (
  <svg className="w-14 h-14" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g fill="#000000" transform="translate(42.666667, 42.666667)">
      <path d="M213.333333,3.55271368e-14 C269.912851,3.55271368e-14 324.175019,22.4761259 364.18278,62.4838867 C404.190541,102.491647 426.666667,156.753816 426.666667,213.333333 C426.666667,331.15408 331.15408,426.666667 213.333333,426.666667 C95.5125867,426.666667 2.84217094e-14,331.15408 2.84217094e-14,213.333333 C2.84217094e-14,95.5125867 95.5125867,3.55271368e-14 213.333333,3.55271368e-14 Z M234.666667,234.666667 L192,234.666667 C139.18529,234.666667 93.8415802,266.653822 74.285337,312.314895 C105.229171,355.70638 155.977088,384 213.333333,384 C270.689579,384 321.437496,355.70638 352.381644,312.31198 C332.825087,266.653822 287.481377,234.666667 234.666667,234.666667 L234.666667,234.666667 Z M213.333333,64 C177.987109,64 149.333333,92.653776 149.333333,128 C149.333333,163.346224 177.987109,192 213.333333,192 C248.679557,192 277.333333,163.346224 277.333333,128 C277.333333,92.653776 248.679557,64 213.333333,64 Z" />
    </g>
  </svg>
);

const Settings = () => {
  const {
    navigateTo,
    user,
    updateUserProfile,
    updateClioConnection,
    isConnectedToClio,
    aiPreferences,
    updateAiPreferences,
    billableLogging,
    updateBillableLogging,
    logout
  } = useAppContext();

  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  const handleConnectClio = async () => {
    await updateClioConnection(!isConnectedToClio);
  };

  const handleUpdateProfile = async (field, value) => {
    await updateUserProfile({ [field]: value });
  };

  const handleAiPreferenceChange = async (field, value) => {
    const newPreferences = { ...aiPreferences, [field]: value };
    await updateAiPreferences(newPreferences);
  };

  const handleBillableLoggingChange = async (field, value) => {
    const newPreferences = { ...billableLogging, [field]: value };
    await updateBillableLogging(newPreferences);
  };

  const handleAvatarUpdate = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        await updateUserProfile({ avatar: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('aiPreferences');
    localStorage.removeItem('billableLogging');
    
    // Clear chrome.storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.clear(() => {
        console.log('🎯 BillableAI: Chrome storage cleared');
      });
    }
    
    // Call logout function from context
    logout();
  };

  // Avatar logic
  const avatar = user.avatar ? (
    <img src={user.avatar} alt="User Avatar" className="w-14 h-14 rounded-full object-cover" />
  ) : USER_PROFILE_SVG;

  return (
    <div className="w-96 h-[600px] bg-gradient-to-br from-black via-blue-900 to-purple-600 flex flex-col">
      {/* Header */}
      

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Update Profile Section */}
        <div className="flex items-center">
          {/* Avatar + Edit */}
          <div className="relative flex flex-col items-center mr-4">
            <div className="w-20 h-20 rounded-full dotted-border flex items-center justify-center bg-white shadow-lg overflow-hidden">
              {avatar}
            </div>
            <button 
              onClick={() => setShowAvatarUpload(!showAvatarUpload)}
              className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-300 hover:bg-blue-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11.293-11.293a1 1 0 0 0 0-1.414l-3.586-3.586a1 1 0 0 0-1.414 0L3 15v6z" />
              </svg>
            </button>
            {/* Avatar Upload Input */}
            {showAvatarUpload && (
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpdate}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ zIndex: 10 }}
              />
            )}
          </div>
          {/* Divider */}
          <div className="h-20 border-l border-dotted border-gray-400 mx-4"></div>
          {/* User Info */}
          <div className="flex flex-col justify-center">
            <span className="text-white text-xl font-bold">{user.name} <span className="text-white/60 text-xs font-normal">({user.gender || 'Not specified'})</span></span>
            <span className="text-white/80 text-base font-medium">{user.profession}</span>
            <span className="text-white/40 text-sm font-normal">United States</span>
          </div>
        </div>

        {/* Horizontal Line */}
        <div className="border-t border-white/20"></div>

        {/* Authentication Section */}
        <div className="text-sm">
          <h2 className="text-white text-base font-semibold mb-3">Authentication</h2>
          <div className="space-y-4">
            {/* Clio Connection */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-xs">Clio Connection</h3>
                <p className="text-white/60 text-xs">
                  {isConnectedToClio ? 'Connected to Clio' : 'Not connected to Clio'}
                </p>
              </div>
              <button
                onClick={handleConnectClio}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-105 ${
                  isConnectedToClio
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                    : 'bg-white text-black hover:bg-gray-100 shadow-lg'
                }`}
              >
                {isConnectedToClio ? 'Connected' : 'Connect to Clio'}
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Line */}
        <div className="border-t border-white/20"></div>

        {/* AI Assistant Preferences Section */}
        <div className="text-sm">
          <h2 className="text-white text-base font-semibold mb-3">AI Assistant Preferences</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-xs mb-1">Email Auto-suggestions</h3>
                {/* <p className="text-white/60 text-xs">Get AI-powered email suggestions</p> */}
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="emailAutoSuggestions"
                    checked={aiPreferences.emailAutoSuggestions === true}
                    onChange={() => handleAiPreferenceChange('emailAutoSuggestions', true)}
                    className="form-radio text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white text-xs">On</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="emailAutoSuggestions"
                    checked={aiPreferences.emailAutoSuggestions === false}
                    onChange={() => handleAiPreferenceChange('emailAutoSuggestions', false)}
                    className="form-radio text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white text-xs">Off</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-white text-xs font-medium mb-1">Default Tone</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultTone"
                    value="Formal"
                    checked={aiPreferences.defaultTone === 'Formal'}
                    onChange={() => handleAiPreferenceChange('defaultTone', 'Formal')}
                    className="form-radio text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white text-xs">Formal</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultTone"
                    value="Casual"
                    checked={aiPreferences.defaultTone === 'Casual'}
                    onChange={() => handleAiPreferenceChange('defaultTone', 'Casual')}
                    className="form-radio text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white text-xs">Casual</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Line */}
        <div className="border-t border-white/20"></div>

        {/* Billable Logging Section */}
        <div className="text-sm">
          <h2 className="text-white text-base font-semibold mb-3">Billable Logging</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-white text-xs font-medium mb-1">Default Time Unit</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultTimeUnit"
                    value="Hours"
                    checked={billableLogging.defaultTimeUnit === 'Hours'}
                    onChange={() => handleBillableLoggingChange('defaultTimeUnit', 'Hours')}
                    className="form-radio text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white text-xs">Hours</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultTimeUnit"
                    value="Minutes"
                    checked={billableLogging.defaultTimeUnit === 'Minutes'}
                    onChange={() => handleBillableLoggingChange('defaultTimeUnit', 'Minutes')}
                    className="form-radio text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white text-xs">Minutes</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultTimeUnit"
                    value="Seconds"
                    checked={billableLogging.defaultTimeUnit === 'Seconds'}
                    onChange={() => handleBillableLoggingChange('defaultTimeUnit', 'Seconds')}
                    className="form-radio text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white text-xs">Seconds</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-xs">Confirmation Before Logging</h3>
                {/* <p className="text-white/60 text-xs">Ask for confirmation before logging time</p> */}
              </div>
              <ToggleSwitch
                checked={billableLogging.confirmationBeforeLogging}
                onChange={(value) => handleBillableLoggingChange('confirmationBeforeLogging', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-xs">Confirmation Before Attaching to Clio</h3>
                {/* <p className="text-white/60 text-xs">Ask for confirmation before attaching to Clio</p> */}
              </div>
              <ToggleSwitch
                checked={billableLogging.confirmationBeforeAttaching}
                onChange={(value) => handleBillableLoggingChange('confirmationBeforeAttaching', value)}
              />
            </div>
          </div>
        </div>

        {/* Horizontal Line */}
        

        {/* Horizontal Line */}
        <div className="border-t border-white/20"></div>

        {/* Logout & Delete Account Buttons */}
        <div className="flex flex-col space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Logout
          </button>
          <button className="w-full py-2 rounded-lg border border-red-600 text-red-600 font-semibold hover:bg-red-500 hover:text-white transition-colors">Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 