/**
 * Validation utility functions for the Banking System.
 */

/**
 * Validates that a value is a non-empty string after trimming.
 * @param {*} value - The value to validate.
 * @param {string} fieldName - Name of the field (used in error messages).
 * @returns {string} The trimmed string.
 */
function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed;
}

/**
 * Validates that a value is a positive number.
 * @param {*} value - The value to validate.
 * @param {string} fieldName - Name of the field (used in error messages).
 * @returns {number} The validated number.
 */
function requirePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${fieldName} must be a number.`);
  }
  if (value <= 0) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
  return value;
}

module.exports = { requireNonEmptyString, requirePositiveNumber };
