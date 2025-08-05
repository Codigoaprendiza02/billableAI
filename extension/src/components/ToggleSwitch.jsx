import React from 'react';

const ToggleSwitch = ({ checked, onChange, className = '' }) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center transition-all duration-300 focus:outline-none ${className}`}
      style={{ width: 48, height: 28, padding: 0, background: 'none', border: 'none' }}
      aria-pressed={checked}
    >
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="44" height="24" rx="12" fill={checked ? '#111' : '#fff'} stroke="#ccc" strokeWidth="2" />
        <circle
          cx={checked ? 36 : 12}
          cy="14"
          r="10"
          fill={checked ? '#fff' : '#fff'}
          stroke={checked ? '#111' : '#ccc'}
          strokeWidth="2"
        />
      </svg>
    </button>
  );
};

export default ToggleSwitch; 