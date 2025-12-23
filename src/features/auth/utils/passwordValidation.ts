/**
 * Password Validation Utilities
 * Provides password strength validation and requirements checking
 */

export interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
  score: number;
}

/**
 * Validate password strength and requirements
 * @param password - Password to validate
 * @returns Validation result with strength and errors
 */
export const validatePassword = (password: string): PasswordValidation => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = {
    minLength: password.length < minLength,
    hasUpperCase: !hasUpperCase,
    hasLowerCase: !hasLowerCase,
    hasNumbers: !hasNumbers,
    hasSpecialChars: !hasSpecialChars,
  };

  // Calculate strength score
  const strengthScore = [
    password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (strengthScore >= 4) {
    strength = 'strong';
  } else if (strengthScore >= 3) {
    strength = 'medium';
  }

  // Password is valid if all requirements are met
  const isValid = Object.values(errors).every((error) => !error);

  return {
    isValid,
    strength,
    errors,
    score: strengthScore,
  };
};

/**
 * Get password strength color
 * @param strength - Password strength level
 * @returns Color code for UI display
 */
export const getPasswordStrengthColor = (
  strength: 'weak' | 'medium' | 'strong'
): string => {
  switch (strength) {
    case 'weak':
      return '#EF4444'; // Red
    case 'medium':
      return '#F59E0B'; // Orange
    case 'strong':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
};

/**
 * Get password strength text
 * @param strength - Password strength level
 * @returns Localized strength text
 */
export const getPasswordStrengthText = (
  strength: 'weak' | 'medium' | 'strong'
): string => {
  switch (strength) {
    case 'weak':
      return 'Zayıf';
    case 'medium':
      return 'Orta';
    case 'strong':
      return 'Güçlü';
    default:
      return '';
  }
};

/**
 * Get password requirements text
 * @returns Array of password requirement strings
 */
export const getPasswordRequirements = (): string[] => {
  return [
    'En az 8 karakter',
    'En az bir büyük harf (A-Z)',
    'En az bir küçük harf (a-z)',
    'En az bir rakam (0-9)',
    'En az bir özel karakter (!@#$%^&*)',
  ];
};

/**
 * Check if password contains common patterns
 * @param password - Password to check
 * @returns True if password contains common patterns
 */
export const hasCommonPatterns = (password: string): boolean => {
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /111111/,
    /123123/,
  ];

  return commonPatterns.some((pattern) => pattern.test(password));
};

/**
 * Comprehensive password validation with common pattern check
 * @param password - Password to validate
 * @returns Extended validation result
 */
export const validatePasswordStrict = (
  password: string
): PasswordValidation & { hasCommonPattern: boolean } => {
  const validation = validatePassword(password);
  const hasCommonPattern = hasCommonPatterns(password);

  return {
    ...validation,
    hasCommonPattern,
    isValid: validation.isValid && !hasCommonPattern,
  };
};









