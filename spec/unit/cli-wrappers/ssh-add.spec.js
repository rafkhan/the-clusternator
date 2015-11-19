'use strict';

var rewire = require('rewire'),
  mockSpawn = require('mock-spawn');

var sshAdd = rewire('../../../src/cli-wrappers/ssh-add'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test git CLI Wrapper', () => {
  beforeEach(() => {
    sshAdd.__set__('spawn', mockSpawn());
  });

  afterEach(() => {
    sshAdd.__set__('spawn', require('child_process').spawn);
  });

});
