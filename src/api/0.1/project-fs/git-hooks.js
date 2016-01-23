'use strict';

const CLUSTERNATOR_PASS = /\$CLUSTERNATOR_PASS/g;

const fs = require('./fs');

module.exports = {
  install
};


/**
 * @param {string} destFilePath
 * @param {string} fileContents
 * @param {string=} perms
 * @returns {Q.Promise}
 */
function installExecutable(destFilePath, fileContents, perms) {
  perms = perms || '700';
  return fs.write(destFilePath, fileContents)
    .then(() => fs.chmod(destFilePath, perms));
}

/**
 * @param {string} root
 * @param {string} name
 * @param {string} passphrase
 * @returns {Q.Promise.<string>}
 */
function install(root, name, passphrase) {
  return fs.getSkeleton('git-' + name)
    .then((contents) => {
      contents = contents.replace(CLUSTERNATOR_PASS, passphrase);
      return installExecutable(
        fs.path.join(root, '.git', 'hooks', name), contents, 300);
    });
}
