'use strict';

const cn = require('../js/js-api');
const fs = require('../project-fs/fs');
const clusternatorJson = require('../project-fs/clusternator-json');

module.exports = {
  listProjects: cn.listProjects,
  describeServices,
  certUpload
};

/**
 * @returns {Q.Promise}
 */
function describeServices() {

  return clusternatorJson
    .get()
    .then((config) => cn
      .describeProject(config.projectId));
}

/**
 * @param {string} privateKey
 * @param {string} certificate
 * @param {string} certId
 * @param {string=} chain
 * @return {Q.Promise}
 */
function certUpload(privateKey, certificate, certId, chain) {
  return fs
    .loadCertificateFiles(privateKey, certificate, chain)
    .then((certs) => cn.certUpload(certId, certs));

}
