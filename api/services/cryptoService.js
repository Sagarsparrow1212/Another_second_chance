const crypto = require('crypto');

/**
 * Encrypt text using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted hex string
 */
const encrypt = (text) => {
  try {
    const secretKey = process.env.ENCRYPTION_SECRET_KEY || 'HomelyHopeEncrypt@1212';
    
    // Create a hash of the secret key to ensure it's 32 bytes (256 bits)
    const key = crypto.createHash('sha256').update(secretKey).digest();
    
    // Generate a random IV (Initialization Vector) for each encryption
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data (IV doesn't need to be secret, just unique)
    // Format: IV (32 hex chars) + encrypted data
    return iv.toString('hex') + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
};

/**
 * Decrypt text using AES-256-CBC
 * @param {string} encryptedText - Encrypted hex string
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText) => {
  try {
    const secretKey = process.env.ENCRYPTION_SECRET_KEY || 'HomelyHopeEncrypt@1212';
    console.log(`[decrypt] Using secret key: ${secretKey.substring(0, 10)}...`);
    console.log(`[decrypt] Encrypted text length: ${encryptedText ? encryptedText.length : 'null'}`);
    
    // Create a hash of the secret key to ensure it's 32 bytes (256 bits)
    const key = crypto.createHash('sha256').update(secretKey).digest();
    
    // Extract IV from the beginning of the encrypted text (first 32 hex chars = 16 bytes)
    if (!encryptedText || encryptedText.length < 32) {
      throw new Error('Encrypted text is too short to contain IV');
    }
    
    const iv = Buffer.from(encryptedText.substring(0, 32), 'hex');
    console.log(`[decrypt] IV extracted: ${iv.toString('hex').substring(0, 10)}...`);
    
    // Extract the actual encrypted data (after the IV)
    const encrypted = encryptedText.substring(32);
    console.log(`[decrypt] Encrypted data length: ${encrypted.length}`);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    
    console.log(`[decrypt] ✅ Decryption successful, decrypted length: ${decrypted.length}`);
    return decrypted;
  } catch (error) {
    console.error('[decrypt] ❌ Decryption error:', error.message);
    console.error('[decrypt] Error stack:', error.stack);
    throw new Error(`Failed to decrypt password: ${error.message}`);
  }
};

module.exports = {
  encrypt,
  decrypt,
};

