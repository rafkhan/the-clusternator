'use strict';

const API_VERSION = '2015-09-21';
const path = require('path');
const AWS = require('aws-sdk');
const config = getConfig();
const privatePath = path.normalize('../' + config.private);
const registryId = getRegistry(config);
const region = getRegion(config);
const credentials = getCredentials(privatePath, region);
const spawn = require('child_process').spawn;

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

function decodeToken(data) {
  const decoded = new Buffer(data.authorizationToken, 'base64')
    .toString('utf8').split(':');
  return {
    user: decoded[0],
    token: decoded[1]
  };
}

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


function safeReq(path, label) {
  try {
    return require(path);
  } catch (err) {
    console.log(`Error loading ${label}: ${err.message}`);
    process.exit(1);
  }
}
function hasAws(config, label) {
  if (!config.aws) {
    console.log(`No AWS credentials found for ${label}`);
    process.exit(2);
  }
}

function getCredentials(privatePath, region) {
  const fileName = 'aws-project-credentials';
  const creds = safeReq(path.join(privatePath, fileName + '.json'), fileName);
  creds.region = region;
  creds.apiVersin = API_VERSION;
  return creds;
}

function getConfig() {
  const config = 'clusternator.json';
  return safeReq(path.join('..', config) , config);
}


function getRegistry(config) {
  hasAws(config, 'registryId');
  return config.aws.registryId;
}

function getRegion(config) {
  hasAws(config, 'region');
  return config.aws.region;
}
