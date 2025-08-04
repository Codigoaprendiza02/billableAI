import React from 'react';

const SendIcon = ({ className = "w-5 h-5" }) => {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
  );
};

export default SendIcon; 