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
 * @returns {{ method: string, uri: string, gzip: boolean, json: Object }}
 */
function makeRequestObject(verb, endpoint, data) {
  const user = getUserConfig();
  const uri = buildURI(endpoint, user);
  if (verb === 'PUT' || verb === 'POST') {
    data = data || null;
    return {
      method: verb,
      uri: uri,
      gzip: true,
      json: data,
      headers: {
        Authorization: 'Token ' + user.credentials.token
      }
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
 * @param {string} verb
 * @param {string} endpoint
 * @param {*=} data
 * @returns {Q.Promise}
 */
function makeRequest(verb, endpoint, data) {
  var d = Q.defer();
  request(
    makeRequestObject(verb, endpoint, data),
    (error, response, body) => {
      if (error) {
        d.reject(error);
        return;
      }
      if (response.statusCode === OKAY) {
        let parsedData;
        if (body) {
          parsedData = safeParse(body);
        } else {
          parsedData = {};
        }
        if (parsedData instanceof Error) {
          d.reject(parsedData);
        } else {
          d.resolve(parsedData);
        }
        return;
      }
      d.reject(new Error(response.statusCode + ' :: ' + body));
    });
  return d.promise;
}

function makePostRequest(endpoint, data) {
  return makeRequest('POST', endpoint, data);
}

function makeGetRequest(endpoint) {
  return makeRequest('GET', endpoint);
}

function normalizeEndSlash(host) {
  if (host[host.length - 1] === '/') {
    return host;
  }
  return host + '/';
}

