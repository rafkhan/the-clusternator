'use strict';
var skeleton = require('./clusternator-json-skeleton');

function truthy(value) {
  return value ? true : false;
}

/**
 * @param {Object} defaults
 * @returns {[]}
 */
function mandatory(defaults) {
  defaults = defaults || {};

  if (!defaults.deploymentsDir) {
    defaults.deploymentsDir = skeleton.deploymentsDir;
  }

  if (!defaults.private) {
    defaults.private = ['.private'];
  }

  return [
    {
      type: 'input',
      name: 'projectId',
      message: 'Project ID',
      default: defaults.name || '',
      validate: truthy
    },
    {
      type: 'input',
      name: 'deploymentsDir',
      message: 'Where will your appDefs/deployment files live?',
      default: defaults.deploymentsDir,
      validate: truthy
    }
  ];
}

function privateChoice() {
  return [
    {
      type: 'input',
      name: 'private',
      message: 'Path to private folder',
      default: '.private'
    }
  ]
}

module.exports = {
  mandatory,
  privateChoice
};