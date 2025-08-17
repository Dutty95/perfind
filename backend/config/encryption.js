import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Get encryption key from environment variable
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // Ensure key is exactly 32 bytes
  if (key.length !== 64) { // 32 bytes = 64 hex characters
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
};

// Encrypt sensitive data
export const encrypt = (text) => {
  if (!text || typeof text !== 'string') {
    return text; // Return as-is if not a string or empty
  }
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine iv and encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt sensitive data
export const decrypt = (encryptedData) => {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return encryptedData; // Return as-is if not encrypted format
  }
  
  // Check if data is in encrypted format (contains colons)
  if (!encryptedData.includes(':')) {
    return encryptedData; // Return as-is if not encrypted
  }
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Encrypt numeric values (amounts)
export const encryptAmount = (amount) => {
  if (typeof amount !== 'number') {
    return amount;
  }
  return encrypt(amount.toString());
};

// Decrypt numeric values (amounts)
export const decryptAmount = (encryptedAmount) => {
  if (typeof encryptedAmount === 'number') {
    return encryptedAmount; // Already decrypted
  }
  
  const decrypted = decrypt(encryptedAmount);
  return parseFloat(decrypted) || 0;
};

// Generate a new encryption key (for setup)
export const generateEncryptionKey = () => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

// Validate encryption key format
export const validateEncryptionKey = (key) => {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Check if key is 64 hex characters (32 bytes)
  return /^[0-9a-fA-F]{64}$/.test(key);
};