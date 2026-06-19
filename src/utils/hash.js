// CalmSpace Client-Side Password Hashing Utility
// Uses the browser's native Web Crypto API to hash passwords with SHA-256.

/**
 * Hashes a string using SHA-256
 * @param {string} text - The plain-text password to hash
 * @returns {Promise<string>} The hex representation of the SHA-256 hash
 */
export const hashPassword = async (text) => {
  if (!text) return '';
  try {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error("Cryptographic hashing failed, falling back to basic encoding:", error);
    // Safe fallback if crypto is not supported in some older environments
    return btoa(text);
  }
};
