const COMMAND = 'ssh-keygen';

var spawn = require('child_process').spawn,
  path = require('path'),
  fs = require('fs'),
  Q = require('q');

var readFile = Q.nbind(fs.readFile, fs),
  writeFile = Q.nbind(fs.writeFile, fs);

function movePublicKey(from, to) {
  return readFile(from).then((contents) => {
    return writeFile(to, contents);
  });
}

/**
 * @todo replace this with `os.homedir()`?
 * https://nodejs.org/api/os.html#os_os_homedir
 * @returns {string}
 */
function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

/**
 * @param {string} keyname
 * @param {string} publicPath
 * @returns {Q.Promise}
 */
function keygen(keyname, publicPath) {
  if (!keyname) {
    throw new TypeError('ssh-keygen requires a target path');
  }
  publicPath = path.join(publicPath, keyname + '.pub');
  keyname = path.join(getUserHome(), '.ssh', keyname);
  var d = Q.defer(),
    sshKeygen = spawn(COMMAND, ['-f', keyname], { stdio: 'inherit' });

  sshKeygen.on('close', (code) => {
    if (+code) {
      d.reject(new Error('git terminated with exit code: ' + code));
    } else {
      movePublicKey(keyname + '.pub', publicPath).then(d.resolve, d.reject);
    }
  });

  return d.promise;
}

module.exports = keygen;
