'use strict';
const OKAY = 200;

var Q = require('q'),
  request = require('request');

function getProjectManager(config) {
  config = config || {};
  var d = Q.defer(),
    credentials;

  init();

  /**
   * @param {string} verb
   * @param {string} endpoint
   * @param {*=} data
   * @returns {{ method: string, uri: string, gzip: boolean, json: Object }}
   */
  function makeRequestObject(verb, endpoint, data) {
    var host = normalizeHost(credentials.host);
    if (verb === 'PUT' || verb === 'POST') {
      data = data || null;
      return {
        method: verb,
        uri: host + config.apiVersion + endpoint,
        gzip: true,
        json: data
      }
    }
    return {
      method: verb,
      uri: host + config.apiVersion + endpoint,
      gzip: true
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
          d.resolve(body);
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

  function normalizeHost(host) {
    if (host[host.length - 1] === '/') {
      return host;
    }
    return host + '/';
  }

  function listProjects() {
  }

  function create() {

  }

  function createPR() {

  }

  function createDeployment() {

  }

  function destroy() {

  }

  function destroyDeployment() {

  }

  function describeProject() {

  }

  function init() {
    if (!config.user || !config.user.credentials) {
      d.reject(new Error('No clusternator credentials found.  Try ' +
        '`clusternator login`'));
      return;
    }
    credentials = config.user.credentials;
    d.resolve({
      create,
      createPR,
      createDeployment,
      destroy,
      destroyDeployment,
      describeProject,
      listProjects,
      helpers: {
        makeRequestObject,
        makeRequest,
        makePostRequest,
        makeGetRequest,
        normalizeHost
      }
    });
  }
  return d.promise;
}

module.exports = getProjectManager;

