'use strict';

var rewire = require('rewire'),
  mockSpawn = require('mock-spawn');

var sshKeygen = rewire('../../../src/cli-wrappers/ssh-keygen'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test git CLI Wrapper', () => {
  beforeEach(() => {
    sshKeygen.__set__('spawn', mockSpawn());
  });

  afterEach(() => {
    sshKeygen.__set__('spawn', require('child_process').spawn);
  });

});
