'use strict';
/**
 * Common functions for the clusternator CLI/REST interface
 * @module clusternator/common
 * @type {string}
 */

const PROTOCOL_PREFIX = 'http';
const PROTOCOL = PROTOCOL_PREFIX + 's://';
const OKAY = 200;
const NOT_AUTHENTICATED = 401;

const Q = require('q');
const Config = require('../config');
const constants = require('../constants');
let request = require('request');

module.exports = {
  makePostRequest,
  helpers: {
    makeRequestObject,
    makeRequest,
    makePostRequest,
    makeGetRequest,
    normalizeEndSlash
  }
};

/**
 * @returns {Object|Error}
 */
function getUserConfig() {
  const config = Config();
  if (!config.user || !config.user.credentials) {
    let e = new Error(
      'No clusternator user credentials found.  Try clusternator login');
    e.code = NOT_AUTHENTICATED;
    return e;
  }
  return config.user;
}

/**
 * @param {string} input
 * @returns {Error|*}
 */
function safeParse(input) {
  try {
    if (typeof input === 'string') {
      return JSON.parse(input);
    } else {
      return input;
    }
  } catch (err) {
    return new Error(`JSON.parse error: ${err.message}`);
  }
}

/**
 * @param {string} uri
 */
function warnNoEncryption(uri) {
  if (uri.indexOf('https://') === 0) {
    return;
  }
  /*eslint no-console: 0*/
  console.log(' ');
  console.log('** WARNING ** Not Using SSL!');
  console.log(' ');
}

/**
 * @param {string} endpoint
 * @param {Object} user
 * @returns {string}
 */
function buildURI(endpoint, user) {
  const credentials = user.credentials;
  const host = normalizeEndSlash(credentials.host);
  const API_VERSION = user.apiVersion || constants.DEFAULT_API_VERSION;
  const uri = host + API_VERSION + endpoint;
  if (host.indexOf(PROTOCOL_PREFIX) === 0) {
    return uri;
  }
  return PROTOCOL + uri;
}

/**
 * @param {boolean} useToken
 * @param {{ credentials: { token: string} }} user
 * @returns {Object}
 */
function makeHeaders(useToken, user) {
  if (useToken) {
    return {
      Authorization: 'Token ' + user.credentials.token
    };
  } else {
    return {};
  }
}

/**
 * @param {string} verb
 * @param {string} uri
 * @param {*} data
 * @param {Object} headers
 * @returns {{method: string, uri: string, gzip: boolean, json: Object,
  headers: Object}}
 */
function makePutPostReqObject(verb, uri, data, headers) {
  return {
      method: verb,
      uri: uri,
      gzip: true,
      json: data,
      headers: headers
    };
}

/**
 * @param {string} uri
 * @param {Object} headers
 * @returns {{method: string, uri: string, gzip: boolean, headers: Object}}
 */
function makeGetRequestObject(uri, headers) {
  return {
    method: 'GET',
    uri: uri,
    gzip: true,
    headers: headers
  };
}

/**
 * @param {string} verb
 * @param {string} endpoint
 * @param {*=} data
 * @param {boolean=} useToken defaults true
 * @returns {{ method: string, uri: string, gzip: boolean,
 json: Object= }|Error}
 */
function makeRequestObject(verb, endpoint, data,  useToken) {
  useToken = useToken === false ? false : true;
  const user = getUserConfig();
  if (user instanceof Error) {
    return user;
  }
  const uri = buildURI(endpoint, user);

  warnNoEncryption(uri);

  let headers = makeHeaders(useToken, user);

  if (useToken) {
    if (!user.credentials.token) {
      let e = new Error('No saved token');
      e.code = NOT_AUTHENTICATED;
      return e;
    }
  }

  if (verb === 'PUT' || verb === 'POST') {
    data = data || null;
    return makePutPostReqObject(verb, uri, data, headers);
  }
  return makeGetRequestObject(uri, headers);
}

/**
 * @param {string} body
 * @returns {Q.Promise}
 */
function okayResponse(body) {
  let parsedData;

  if (body) {
    parsedData = safeParse(body);
  } else {
    parsedData = {};
  }
  if (parsedData instanceof Error) {
    return Q.reject(parsedData);
  } else {
    return Q.resolve(parsedData);
  }
}

/**
 * @param {*} body
 * @param {number} statusCode
 * @returns {string}
 */
function failResponse(body, statusCode) {
  let errorBody = safeParse(body);
  let errorMessage;

  if (errorBody instanceof Error) {
    errorMessage = `Error: ${statusCode}`;
  } else if (errorBody && errorBody.error) {
    errorMessage = errorBody.error + '';
  } else {
    errorMessage = `Error: ${statusCode}`;
  }

  return errorMessage;
}

/**
 * @param {string} verb
 * @param {string} endpoint
 * @param {*=} data
 * @param {boolean=} useToken defaults to true, if false, won't use token
 * @returns {Q.Promise}
 */
function makeRequest(verb, endpoint, data, useToken) {
  let d = Q.defer();
  const reqObject  = makeRequestObject(verb, endpoint, data, useToken);
  if (reqObject instanceof Error) {
    d.reject(reqObject);
    return d.promise;
  }
  request(
    reqObject,
    (error, response, body) => {
      if (error) {
        if (error.message.indexOf('ENOTFOUND') >= 0) {
          d.reject(new Error(`Address ${reqObject.uri} not found (Domain not ` +
            'found): Please ensure your clusternator server exists'));
          return;
        }
        d.reject(error);
        return;
      }
      if (response.statusCode === OKAY) {
        okayResponse(body).then(d.resolve, d.reject);
      } else {
        const errorMessage = failResponse(body, response.statusCode);
        d.reject(new Error(errorMessage));
      }
    });
  return d.promise;
}

/**
 * @param {string} endpoint
 * @param {*=} data
 * @param {boolean=} useToken
 * @returns {Q.Promise}
 */
function makePostRequest(endpoint, data, useToken) {
  return makeRequest('POST', endpoint, data, useToken);
}

/**
 * @param {string} endpoint
 * @param {boolean=} useToken
 * @returns {Q.Promise}
 */
function makeGetRequest(endpoint, useToken) {
  return makeRequest('GET', endpoint, null, useToken);
}

function normalizeEndSlash(host) {
  if (host[host.length - 1] === '/') {
    return host;
  }
  return host + '/';
}

