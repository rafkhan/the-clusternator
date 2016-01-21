'use strict';
const OKAY = 200;

const PROTOCOL = 'https://';
const Q = require('q');
const constants = require('../constants');
var request = require('request');

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
    var host = normalizeEndSlash(credentials.host);
    const API_VERSION = config.apiVersion || constants.DEFAULT_API_VERSION;
    const uri = PROTOCOL + host + API_VERSION + endpoint;
    if (verb === 'PUT' || verb === 'POST') {
      data = data || null;
      return {
        method: verb,
        uri: uri,
        gzip: true,
        json: data
      };
    }
    return {
      method: verb,
      uri: uri,
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

  function normalizeEndSlash(host) {
    if (host[host.length - 1] === '/') {
      return host;
    }
    return host + '/';
  }

  function listProjects() {
  }

  /**
   * @param {string} projectId
   * @returns {Q.Promise}
   */
  function create(projectId) {
    return makePostRequest('/project/create', { projectId });
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
        normalizeEndSlash
      }
    });
  }
  return d.promise;
}

module.exports = getProjectManager;

