import crypto from 'crypto';
import os from 'os';

/**
 * Derives a machine-specific encryption key using PBKDF2.
 * The key is tied to the machine's hostname, username, and platform
 * so an encrypted settings file can't be copied to another computer
 * and decrypted there.
 */
function deriveKey() {
  const machineFingerprint = [
    os.hostname(),
    os.userInfo().username,
    os.platform(),
    os.homedir(),
  ].join('|');

  // Static salt combined with machine fingerprint
  const salt = crypto
    .createHash('sha256')
    .update('rp-room-bot:' + machineFingerprint)
    .digest();

  return crypto.pbkdf2Sync(machineFingerprint, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing IV + auth tag + ciphertext.
 */
export function encrypt(plaintext) {
  const key = deriveKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit tag

  // Pack: IV (12) + authTag (16) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypt a base64-encoded string produced by encrypt().
 * Returns the original plaintext, or null if decryption fails
 * (wrong machine, tampered data, etc.).
 */
export function decrypt(encoded) {
  try {
    const key = deriveKey();
    const packed = Buffer.from(encoded, 'base64');

    const iv = packed.subarray(0, 12);
    const authTag = packed.subarray(12, 28);
    const ciphertext = packed.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // Decryption failed — wrong key, tampered, or different machine
    return null;
  }
}
