'use strict';

var rewire = require('rewire'),
  mockSpawn = require('mock-spawn');

var git = rewire('../../../src/cli-wrappers/git'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test git CLI Wrapper', () => {
  beforeEach(() => {
    git.__set__('spawn', mockSpawn());
  });

  afterEach(() => {
    git.__set__('spawn', require('child_process').spawn);
  });

});
