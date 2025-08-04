import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const USER_PROFILE_SVG = (
  <svg className="w-6 h-6" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g fill="#000000" transform="translate(42.666667, 42.666667)">
      <path d="M213.333333,3.55271368e-14 C269.912851,3.55271368e-14 324.175019,22.4761259 364.18278,62.4838867 C404.190541,102.491647 426.666667,156.753816 426.666667,213.333333 C426.666667,331.15408 331.15408,426.666667 213.333333,426.666667 C95.5125867,426.666667 2.84217094e-14,331.15408 2.84217094e-14,213.333333 C2.84217094e-14,95.5125867 95.5125867,3.55271368e-14 213.333333,3.55271368e-14 Z M234.666667,234.666667 L192,234.666667 C139.18529,234.666667 93.8415802,266.653822 74.285337,312.314895 C105.229171,355.70638 155.977088,384 213.333333,384 C270.689579,384 321.437496,355.70638 352.381644,312.31198 C332.825087,266.653822 287.481377,234.666667 234.666667,234.666667 L234.666667,234.666667 Z M213.333333,64 C177.987109,64 149.333333,92.653776 149.333333,128 C149.333333,163.346224 177.987109,192 213.333333,192 C248.679557,192 277.333333,163.346224 277.333333,128 C277.333333,92.653776 248.679557,64 213.333333,64 Z" />
    </g>
  </svg>
);

const SettingsComponent = () => {
  const { user, isConnectedToClio, setIsConnectedToClio, navigateTo } = useAppContext();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnectClio = () => {
    // TODO: Implement Clio OAuth
    setIsConnectedToClio(!isConnectedToClio);
  };

  const handleSettingsClick = () => {
    navigateTo('settings');
  };

  const handleProfileClick = () => {
    setShowMenu(!showMenu);
  };

  // Use user.avatar if present, else default SVG
  const avatar = user.avatar ? (
    <img src={user.avatar} alt="User Avatar" className="w-6 h-6 rounded-full object-cover" />
  ) : USER_PROFILE_SVG;

  return (
    <div className="flex items-center space-x-3">
      {/* Connect to Clio Button */}
      <button
        onClick={handleConnectClio}
        className={`px-2 py-1 rounded-md font-semibold text-xs border border-black transition-all duration-200 hover:scale-105 ${
          isConnectedToClio
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-white text-black hover:bg-gray-100'
        }`}
      >
        {isConnectedToClio ? 'Connected to Clio' : 'Connect to Clio'}
      </button>

      {/* Profile Avatar */}
      <div className="relative">
        <button
          onClick={handleProfileClick}
          className="w-8 h-8 rounded-full bg-white/10 border border-white/30 flex items-center justify-center hover:border-white/50 hover:scale-105 transition-all duration-200 overflow-hidden"
        >
          {avatar}
        </button>

        {/* Profile Menu Dropdown */}
        {showMenu && (
          <div className="absolute right-0 top-10 w-40 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 z-10 shadow-lg">
            <button className="w-full text-left px-3 py-2 text-white hover:bg-white/20 rounded text-sm transition-colors">
              Update Avatar
            </button>
            <button className="w-full text-left px-3 py-2 text-white hover:bg-white/20 rounded text-sm transition-colors">
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Settings Icon */}
      <button
        onClick={handleSettingsClick}
        className="w-8 h-8 rounded-full bg-white/10 border border-white/30 flex items-center justify-center hover:bg-white/30 hover:scale-105 transition-all duration-200"
      >
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      </button>
    </div>
  );
};

export default SettingsComponent; 