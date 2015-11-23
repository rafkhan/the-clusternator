'use strict';
var skeleton = require('./clusternator-json-skeleton'),
  util = require('./util');

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
    defaults.deploymentsDir = util.clone(skeleton.deploymentsDir);
  }

  if (!defaults.private || !defaults.private.length) {
    defaults.private = util.clone(skeleton.private);
    defaults.private.push('.private');
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
    },
    {
      type: 'input',
      name: 'private',
      message: 'Where will your private files live?',
      default: defaults.private,
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