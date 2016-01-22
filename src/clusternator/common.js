'use strict';

const PROTOCOL_PREFIX = 'http';
const PROTOCOL = PROTOCOL_PREFIX + 's://';
const OKAY = 200;

const Q = require('q');
const Config = require('../config');
const constants = require('../constants');
var request = require('request');

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

function getUserConfig() {
  const config = Config();
  if (!config.user || !config.user.credentials) {
    throw new Error(
      'No clusternator user credentials found.  Try clusternator login');
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
 * @param {string} verb
 * @param {string} endpoint
 * @param {*=} data
 * @param {boolean=} noToken
 * @returns {{ method: string, uri: string, gzip: boolean, json: Object }}
 */
function makeRequestObject(verb, endpoint, data,  noToken) {
  const user = getUserConfig();
  const uri = buildURI(endpoint, user);
  let headers;
  if (noToken) {
    headers = {};
  } else {
    headers = {
      Authorization: 'Token ' + user.credentials.token
    };
  }
  if (verb === 'PUT' || verb === 'POST') {
    data = data || null;
    return {
      method: verb,
      uri: uri,
      gzip: true,
      json: data,
      headers: headers
    };
  }
  return {
    method: verb,
    uri: uri,
    gzip: true,
    headers: {
      Authorization: 'Token ' + user.credentials.token
    }
  };
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
 * @param {boolean=} noToken defaults to false, if true, won't use token
 * @returns {Q.Promise}
 */
function makeRequest(verb, endpoint, data, noToken) {
  var d = Q.defer();
  request(
    makeRequestObject(verb, endpoint, data, noToken),
    (error, response, body) => {
      if (error) {
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
 * @param {boolean=} noToken
 * @returns {Q.Promise}
 */
function makePostRequest(endpoint, data, noToken) {
  return makeRequest('POST', endpoint, data, noToken);
}

/**
 * @param {string} endpoint
 * @param {boolean=} noToken
 * @returns {Q.Promise}
 */
function makeGetRequest(endpoint, noToken) {
  return makeRequest('GET', endpoint, null, noToken);
}

function normalizeEndSlash(host) {
  if (host[host.length - 1] === '/') {
    return host;
  }
  return host + '/';
}

