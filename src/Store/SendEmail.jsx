import CryptoJS from 'crypto-js';
import axios from 'axios';

// Must match backend config
const algorithm = 'aes-256-cbc'; // Just for reference; not used in crypto-js config directly
const secretKey = '12345678901234567890123456789012'; // 32 bytes
const iv = '00000000000000000000000000000000'; // 16 bytes hex

/**
 * Encrypts a JavaScript object using AES-256-CBC
 * @param {object} data - The data to encrypt
 * @returns {string} - Hex-encoded encrypted string
 */
export function encrypt(data) {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const ivParsed = CryptoJS.enc.Hex.parse(iv);

  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    key,
    {
      iv: ivParsed,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

/**
 * Sends an encrypted email payload to the server.
 * @param {'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8'} version - API version
 * @param {string} url - Base URL (e.g., https://mail.skoegle.co.in)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body
 * @returns {Promise<object>} - Server response
 */
export async function sendEmail(version, url, to, subject, text) {
  try {
    const payload = { to, subject, text };
    const encryptedPayload = encrypt(payload);

    const response = await axios.post(`${url}/send-email-${version}`, {
      payload: encryptedPayload,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    // console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}
