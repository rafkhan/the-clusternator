'use strict';
var skeleton = require('./clusternator-json-skeleton'),
  util = require('../util');

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
    },
    {
      type: 'confirm',
      name: 'passphrase',
      message: 'Do you have a passphrase, or would you like a passphrase (If unsure say no)',
      default: false
    }
  ];
}

function encryptionChoice() {
  return [
    {
      type: 'input',
      name: 'passphraseInput',
      message: 'If you have a passphrase paste it in here, otherwise enter "gen" to generate one',
      default: 'gen',
      validate: (input) => {
        if (!input) {
          return false;
        }
        if (input.toLowerCase() === 'gen') {
          return true;
        }
        if (input.length < 20) {
          return false;
        }
        return true;
      }
    }
  ];
}

function gitHookChoice() {
  return [
    {
      type: 'confirm',
      name: 'gitHooks',
      message: 'Would you like git hooks installed that will encrypt/decrypt your .private files before/after commit, and after pulls?',
      default: true
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
  privateChoice,
  gitHookChoice,
  encryptionChoice
};