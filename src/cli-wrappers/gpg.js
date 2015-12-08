/* @todo make COMMAND configurable */
const COMMAND = 'gpg';
/* @todo _maybe_ make CRYPTO_ALGO configurable */
const CRYPTO_ALGO = 'AES256';
const FLAG_OUT = '--output';
const FLAG_QUIET = '--quiet';
const FLAG_ALGO = '--cipher-algo';
const FLAG_ARMOR = '--armor';
const FLAG_PASSPHRASE = '--passphrase';
const FLAG_SYMMETRIC = '--symmetric';
const FLAG_DECRYPT = '--decrypt';

var spawn = require('child_process').spawn,
  crypto = require('crypto'),
  b64 = require('base64url'),
  Q = require('q');

/**
  @param {string} passphrase - encryption passphrase
  @param {string} cleartext - data to encrypt
  @return {Q.Promise<string>} - promise for an encrypted string
*/
function encrypt(passphrase, cleartext) {
  var d = Q.defer(),
    gpg,
    error = '',
    output = '';

  if (passphrase.length < 30) {
    d.reject(new Error(`GPG: Passphrases must be *at least* thirty (30)
    characters`));
    return d.promise;
  }

  gpg = spawn(COMMAND, [
    FLAG_ALGO, CRYPTO_ALGO, FLAG_ARMOR, FLAG_PASSPHRASE, passphrase,
    FLAG_SYMMETRIC
  ]);

  gpg.stdout.on('data', (data) => {
    output += data;
  });

  gpg.stderr.on('data', (data) => {
    error += data;
  });

  gpg.on('close', (code) => {
    if (+code) {
      d.reject(new Error('GPG terminated with exit code: ' + code));
    } else {
      d.resolve(output);
    }
  });

  gpg.stdin.write(cleartext);
  gpg.stdin.end();

  return d.promise;
}

/**
  @param {string} passphrase - passphrase to decrypt with
  @param {string} ciphertext - encrypted text
  @return {Q.Promise<string>} promise to return clear text string
*/
function decrypt(passphrase, ciphertext) {
  var d = Q.defer(),
    gpg = spawn(COMMAND, [
      FLAG_QUIET, FLAG_PASSPHRASE, passphrase, FLAG_DECRYPT
    ]),
    error = '',
    output = '';

  gpg.stdout.on('data', (data) => {
    output += data;
  });

  gpg.stderr.on('data', (data) => {
    error += data;
  });

  gpg.on('close', (code) => {
    if (+code) {
      d.reject(new Error('GPG terminated with exit code: ' + code));
    } else {
      d.resolve(output);
    }
  });

  gpg.stdin.write(ciphertext);
  gpg.stdin.end();

  return d.promise;
}

/**
  @param {string} passphrase - encryption passphrase
  @param {string} filePath - path to file
  @return {Q.Promise<string>} - promise for an encrypted string
*/
function encryptFile(passphrase, filePath) {
  var d = Q.defer(),
    gpg,
    error = '',
    output = '';

  if (passphrase.length < 30) {
    d.reject(new Error(`GPG: Passphrases must be *at least* thirty (30)
    characters`));
    return d.promise;
  }

  gpg = spawn(COMMAND, [
    FLAG_ALGO, CRYPTO_ALGO, FLAG_ARMOR, FLAG_PASSPHRASE, passphrase,
    FLAG_SYMMETRIC, filePath
  ]);

  gpg.stdout.on('data', (data) => {
    output += data;
  });

  gpg.stderr.on('data', (data) => {
    error += data;
  });

  gpg.on('close', (code) => {
    if (+code) {
      d.reject(new Error('GPG terminated with exit code: ' + code));
    } else {
      d.resolve(output);
    }
  });

  gpg.stdin.end();

  return d.promise;
}

/**
  @param {string} passphrase - passphrase to decrypt with
  @param {string} cipherFilePath - path to encrypted file
  @parma {string} outputFilePath - path to output
  @return {Q.Promise<string>} promise to return clear text string
*/
function decryptFile(passphrase, cipherFilePath, outputFilePath) {
  var d = Q.defer(),
    gpg = spawn(COMMAND, [
      FLAG_QUIET, FLAG_PASSPHRASE, passphrase, FLAG_OUT, outputFilePath,
      FLAG_DECRYPT, cipherFilePath
    ]),
    error = '',
    output = '';

  gpg.stdout.on('data', (data) => {
    output += data;
  });

  gpg.stderr.on('data', (data) => {
    error += data;
  });

  gpg.on('close', (code) => {
    if (+code) {
      d.reject(new Error('GPG terminated with exit code: ' + code));
    } else {
      d.resolve(output);
    }
  });

  gpg.stdin.end();

  return d.promise;
}

/**
 * @returns {Q.Promise<string>}
 */
function generatePass() {
  var d = Q.defer();
  crypto.randomBytes(50, (err, buff) => {
    if (err) {
      d.reject(err);
      return;
    }
    d.resolve(b64(buff));
  });
  return d.promise;
}

module.exports = {
  escape,
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  generatePass
};
