'use strict';

const CLUSTERNATOR_FILE = 'clusternator.json';
const AWS_FILE = 'aws.json';
const API_VERSION = '2015-09-21';
const path = require('path');
const AWS = require('aws-sdk');
const config = getConfig();
const privatePath = path.normalize('../' + config.private);
const awsConfig = getAwsConfig(privatePath);
const registryId = awsConfig.registryId;
const region = awsConfig.region;
const credentials = getCredentials(privatePath, region);
const spawn = require('child_process').spawn;

main();

function main() {
  const ecr = new AWS.ECR(credentials);

  ecr.getAuthorizationToken({
    registryIds: [ registryId ]
  }, (err, result) => {
    if (err) {
      console.log(`Error getting login credentials ${err.message}`);
      process.exit(2);
    }
    if (!result.authorizationData[0]) {
      process.exit(3);
    }
    login(result.authorizationData[0]);
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
 */
function login(data) {
  const decoded = decodeToken(data);
  const end = data.proxyEndpoint;
  const args = [
    'login', '-u', decoded.user, '-p', decoded.token, '-e', 'none', end];
  const dlogin = spawn('docker', args);
  let output = '';
  let err = '';

  dlogin.stdout.setEncoding('utf8');
  dlogin.stderr.setEncoding('utf8');
  dlogin.stdout.on('data', (data) => output += data);
  dlogin.stderr.on('data', (data) => err += data);
  dlogin.on('close', (code) => {
    if (+code) {
      console.log(output);
      console.log(err);
      process.exit(4);
    } else {
      console.log(output);
      process.exit(0);
    }
  });
}

/**
 * @param {string} path
 * @param {string} label
 * @returns {string}
 * @exits
 */
function safeReq(path, label) {
  try {
    return require(path);
  } catch (err) {
    console.log(`Error loading ${label}: ${err.message}`);
    process.exit(1);
  }
}

/**
 * @param {{ aws?: Object }} config
 * @param {string} label
 */
function hasAws(config, label) {
  if (!config.aws) {
    console.log(`No AWS credentials found for ${label}`);
    process.exit(2);
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
  creds.apiVersin = API_VERSION;
  return creds;
}

function getConfig() {
  return safeReq(path.join('..', CLUSTERNATOR_FILE) , CLUSTERNATOR_FILE);
}

function getAwsConfig(privatePath) {
  return safeReq(path.join(privatePath, AWS_FILE));
}
