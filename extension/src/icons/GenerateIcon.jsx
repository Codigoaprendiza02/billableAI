import React from 'react';

const GenerateIcon = ({ className = "w-5 h-5" }) => {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      {/* Document with sparkles icon */}
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
      <path d="M14 2v6h6"/>
      {/* Sparkles */}
      <path d="M12 18l-1.5-1.5L9 18l1.5 1.5L12 18z"/>
      <path d="M16 14l-1-1-1 1 1 1 1-1z"/>
      <path d="M8 14l-1-1-1 1 1 1 1-1z"/>
    </svg>
  );
};

export default GenerateIcon; 