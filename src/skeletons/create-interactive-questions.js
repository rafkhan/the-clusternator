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

  if (!defaults.tld) {
    defaults.tld = 'example.com';
  }

  if (!defaults.clusternatorDir) {
    defaults.clusternatorDir = util.clone(skeleton.clusternatorDir)
  }

  if (!defaults.private || !defaults.private.length) {
    defaults.private = util.clone(skeleton.private);
    defaults.private.push('.private');
  }

  function hasPassphrase(response) {
    return response.passphrase;
  }

  function hasBackend(response) {
    return response.backend === 'node' ? true : false;
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
      name: 'clusternatorDir',
      message: 'Where should clusternator keep its files?',
      default: defaults.clusternatorDir,
      validate: truthy
    },
    {
      type: 'input',
      name: 'tld',
      message: 'What Top Level Domain (TLD) Will This Be Served From?',
      default: defaults.tld,
      validate: truthy
    },
    {
      type: 'list',
      name: 'backend',
      choices: ['static', 'node'],
      message: 'Choose a backend'
    },
    {
      when: hasBackend,
      type: 'confirm',
      name: 'usePrivateFolder',
      message: 'Will you use a "private" folder?',
      default: true
    },
    {
      when: (response) => response.usePrivateFolder,
      type: 'input',
      name: 'private',
      message: 'Where will your private files live?',
      default: '.private'
    },
    {
      type: 'input',
      name: 'deploymentsDir',
      message: 'Where will your appDefs/deployment files live?',
      default: defaults.deploymentsDir,
      validate: truthy
    },
    {
      when: hasBackend,
      type: 'confirm',
      name: 'passphrase',
      message: 'Do you have a passphrase, or would you like a passphrase (If unsure say no)',
      default: false
    },
    {
      when: hasPassphrase,
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
    },
    {
      when: hasPassphrase,
      type: 'confirm',
      name: 'gitHooks',
      message: 'Would you like git hooks installed that will encrypt/decrypt your .private files before/after commit, and after pulls?',
      default: true
    },
    {
      type: 'confirm',
      name: 'circleCI',
      message: 'Will you be using CircleCI?',
      default: true
    }
  ];
}

module.exports = {
  mandatory
};
