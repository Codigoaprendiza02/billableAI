import React from 'react';

const AvatarIcon = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      {/* Simple cat-like face */}
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      {/* Eyes */}
      <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
      {/* Nose */}
      <circle cx="12" cy="12" r="0.8" fill="currentColor"/>
      {/* Mouth */}
      <path d="M9 15c0 0 1.5 1 3 1s3-1 3-1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Ears */}
      <path d="M7 7l2-2 2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M17 7l-2-2-2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
};

export default AvatarIcon; 