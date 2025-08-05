// Password validation utility
export const validatePassword = (password) => {
  const errors = [];
  
  // Check length
  if (password.length < 15) {
    errors.push('Password must be at least 15 characters long');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  
  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }
  
  // Check for special character
  const specialChars = '!@#$%^&*()_\-+={}\[\]|\\:;"\'<>?,./';
  const hasSpecialChar = specialChars.split('').some(char => password.includes(char));
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_-+={}[]|\\:;"\'<>?,./)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password strength checker
export const getPasswordStrength = (password) => {
  let score = 0;
  
  // Length bonus
  if (password.length >= 15) score += 2;
  if (password.length >= 20) score += 1;
  
  // Character variety bonus
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  const specialChars = '!@#$%^&*()_\-+={}\[\]|\\:;"\'<>?,./';
  const hasSpecialChar = specialChars.split('').some(char => password.includes(char));
  if (hasSpecialChar) score += 1;
  
  // No consecutive characters bonus
  let hasConsecutive = false;
  for (let i = 0; i < password.length - 2; i++) {
    if (password.charCodeAt(i) + 1 === password.charCodeAt(i + 1) && 
        password.charCodeAt(i + 1) + 1 === password.charCodeAt(i + 2)) {
      hasConsecutive = true;
      break;
    }
  }
  if (!hasConsecutive) score += 1;
  
  // No repeated characters bonus
  let hasRepeated = false;
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i + 1] === password[i + 2]) {
      hasRepeated = true;
      break;
    }
  }
  if (!hasRepeated) score += 1;
  
  if (score >= 6) return 'Strong';
  if (score >= 4) return 'Medium';
  return 'Weak';
}; 