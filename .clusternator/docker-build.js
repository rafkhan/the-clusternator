'use strict';

const CLUSTERNATOR_PREFIX = 'clusternator-';
const DOCKER_CMD = 'docker';
const CLUSTERNATOR_FILE = 'clusternator.json';
const AWS_FILE = CLUSTERNATOR_PREFIX + 'aws.json';
const CLUSTERNATOR_TOKEN = CLUSTERNATOR_PREFIX + 'project-credentials.json';
const API_VERSION = '2015-09-21';
const path = require('path');
const AWS = require('aws-sdk');
const spawn = require('child_process').spawn;
const notify = require('./notify');

main();

function main() {
  const config = getConfig();
  const privatePath = path.normalize('../' + config.private);
  const awsConfig = getAwsConfig(privatePath);
  const registryId = awsConfig.registryId;
  const region = awsConfig.region;
  const credentials = getCredentials(privatePath, region);
  const clusternatorToken = getClusternatorToken(privatePath);

  getToken(credentials, registryId)
    .then((tokenObj) => {
      const imageName = buildImageName(config.projectId);
      return login(tokenObj)
        .then(() => wipePrivate(privatePath))
        .then(() => dockerBuild(imageName))
        .then(() => dockerTag(tokenObj.proxyEndpoint, imageName))
        .then((fullImageName) => dockerPush(fullImageName)
          .then(decrypt)
          .then(() => notify(
            config.projectId, clusternatorToken, fullImageName)));
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.log(`Error: ${err.message}`);
      process.exit(1);
    });

}

/**
 * @param {string} projectId
 * @returns {string}
 */
function buildImageName(projectId) {
  const PR = process.env.CIRCLE_PR_NUMBER || 0;
  const BUILD = process.env.CIRCLE_BUILD_NUM || 0;
  const IMAGE=`${CLUSTERNATOR_PREFIX}${projectId}:pr-${PR}-${BUILD}`;
  return IMAGE;
}

/**
 * @param {Object} creds
 * @param {string} registryId
 * @returns {Promise}
 */
function getToken(creds, registryId) {
  const ecr = new AWS.ECR(creds);

  return new Promise((resolve, reject) => {
    ecr.getAuthorizationToken({
      registryIds: [registryId]
    }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      if (!result.authorizationData[0]) {
        reject(new Error('no AWS authorization data returned'));
        return;
      }
      resolve(result.authorizationData[0]);
    });
  });
}

/**
 * @param {base64string} data
 * @returns {{user: string, token: string}}
 */
function decodeToken(data) {
  const decoded = new Buffer(data.authorizationToken, 'base64')
    .toString('utf8').split(':');
  return {
    user: decoded[0],
    token: decoded[1]
  };
}
/**
 * @param {{ token: base64String, proxyEndpoint: string }} data
 * @return {Promise<{{ token: base64string, proxyEndpoint: string}}>}
 */
function login(data) {
  const decoded = decodeToken(data);
  const end = data.proxyEndpoint;
  const args = [
    'login', '-u', decoded.user, '-p', decoded.token, '-e', 'none', end];
  return spawnOutput(DOCKER_CMD, args);
}


/**
 * @param {string} path
 * @param {string} label
 * @returns {string}
 * exits
 */
function safeReq(path, label) {
  try {
    return require(path);
  } catch (err) {
    console.log(`Error loading ${label}: ${err.message}`);
    process.exit(3);
  }
}

/**
 * @param {string} privatePath
 * @param {string} region
 * @returns {string}
 */
function getCredentials(privatePath, region) {
  const fileName = 'aws-project-credentials';
  const creds = safeReq(path.join(privatePath, fileName + '.json'), fileName);
  creds.region = region;
  creds.apiVersion = API_VERSION;
  return creds;
}

function getClusternatorToken(privatePath) {
  return safeReq(path
      .join(privatePath, CLUSTERNATOR_TOKEN), CLUSTERNATOR_TOKEN).token || null;
}

function getConfig() {
  return safeReq(path.join('..', CLUSTERNATOR_FILE) , CLUSTERNATOR_FILE);
}

function getAwsConfig(privatePath) {
  return safeReq(path.join(privatePath, AWS_FILE));
}

/**
 * @param {string} command
 * @param {*[]} args
 * @returns {Promise}
 */
function spawnOutput(command, args) {
  args = Array.isArray(args) ? args : [];
  const child = spawn(command, args);
  let err = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (data) => console.log(data));
  child.stderr.on('data', (data) => err += data);

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (+code) {
        reject(new Error(`${err} code: ${code}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * @param {string} endPoint
 * @returns {string}
 */
function cleanEndPoint(endPoint) {
  if (endPoint.indexOf('https://') === 0) {
    return endPoint.slice(8);
  }
  return endPoint;
}

/**
 * @param {string} endPoint
 * @param {string} imageName
 * @returns {Promise}
 */
function dockerTag(endPoint, imageName) {
  const target = `${cleanEndPoint(endPoint)}/${imageName}`;
  return spawnOutput(DOCKER_CMD, ['tag', imageName, target])
    .then(() => target);
}

/**
 * @param {string} fullImageName
 * @returns {Promise}
 */
function dockerPush(fullImageName) {
  return spawnOutput(DOCKER_CMD, ['push', fullImageName]);
}

/**
 * @param {string} imageName
 * @return {Promise}
 */
function dockerBuild(imageName) {
  const cwd = process.cwd();
  process.chdir(path.join(__dirname, '..'));
  return spawnOutput(DOCKER_CMD, ['build', '-t', imageName, './'])
    .then(() => process.chdir(cwd));
}

/**
 * @returns {Promise}
 */
function decrypt() {
  return spawnOutput(path.join(__dirname, 'decrypt.sh'), []);
}

/**
 * @param {string} privatePath
 * @returns {Promise}
 */
function wipePrivate(privatePath) {
  return spawnOutput('rm', ['-rf', privatePath]);
}

