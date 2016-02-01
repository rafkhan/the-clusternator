'use strict';
/**
 * Symmetric encryption module (wraps node crypto)
 *
 * @module server/cryptoSymmetric
 */

const crypto = require('crypto');
const ALGO = 'aes-256-ctr';

module.exports = {
  encrypt,
  decrypt
};

/**
 * @param {string} passphrase
 * @param {string} text
 * @returns {string}
 */
function encrypt(passphrase, text) {
  const cipher = crypto.createCipher(ALGO, passphrase);
  return cipher.update(text,'utf8','hex') + cipher.final('hex');
}

/**
 *
 * @param {string} passphrase
 * @param {string} text
 * @returns {string}
 */
function decrypt(passphrase, text){
  const decipher = crypto.createDecipher(ALGO, passphrase);
  return decipher.update(text,'hex','utf8') + decipher.final('utf8');
}

