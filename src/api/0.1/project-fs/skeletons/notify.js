'use strict';

// We need this to build our post string
const querystring = require('querystring');
const path = require('path');
const http = require('https');

const HOST = `$HOST`;
const CLUSTERNATOR = `the-clusternator.${HOST}`;
const PORT = 443;
const PATH = '/$DEFAULT_API/pr/create';
const CONFIG_FILE = 'clusternator.json';

module.exports = main;

/**
 * @param {string} projectId
 * @param {string} key
 * @param {string} image
 * @returns {Promise}
 */
function main(projectId, key, image, sshKeys) {
  const pr = process.env.CIRCLE_PR_NUMBER || 0;
  const build = process.env.CIRCL_BUILD_NUM || 0;
  const SHARED_KEY = process.env.CLUSTERNATOR_SHARED_KEY;
  const repo = projectId;

  // Build the post string from an object
  const data = querystring.stringify({
    pr,
    build,
    repo,
    image,
    sshKeys,
    appDef: getAppDef(SHARED_KEY, HOST, repo, pr, image)
  });

  return post(data, key);
}


function die(err) {
  if (err instanceof Error) {
    throw err;
  }
  throw new Error('unexpected death error');
}

function getAppDefPath() {
  let config;
  try {
    config = require(path.join('..', CONFIG_FILE));
  } catch (err) {
    console.log('Error loading', CONFIG_FILE);
    console.log(err);
    die(err);
  }
  return path.join(
    __dirname, '..', config.deploymentsDir, 'pr'
  );
}

function requireAppDef() {
  const appDefPath = getAppDefPath();
  try {
    return require(appDefPath);
  } catch (err) {
    console.log('Error loading application definition', appDefPath);
    console.log(err);
    die(err);
  }
}

/**
 * @param {string} key
 * @param {string} host
 * @param {string} repo
 * @param {string} pr
 * @param {string} image
 */
function getAppDef(key, host, repo, pr, image) {
  const appDef = requireAppDef();
  appDef.tasks[0].containerDefinitions[0].environment.push({
    name: 'PASSPHRASE',
    value: key
  });
  appDef.tasks[0].containerDefinitions[0].environment.push({
    name: 'HOST',
    value: `${repo}-pr-${pr}.${host}`
  });
  appDef.tasks[0].containerDefinitions[0].image = image;
  return JSON.stringify(appDef);
}

function post(data, auth) {

  // An object of options to indicate where to post to
  const postOptions = {
      host: CLUSTERNATOR,
      port: PORT,
      path: PATH,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data),
          'Authorization': 'Token ' + auth
      }
  };

  console.log('Posting To:', CLUSTERNATOR);
  return new Promise((resolve, reject) => {
    // Set up the request
    const postReq = http.request(postOptions, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        console.log('Response: ' + chunk);
        resolve();
      });
      res.on('error', reject);
    });

    // post the data
    postReq.write(data);
    postReq.end();
  });
}

