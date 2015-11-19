'use strict';

var rewire = require('rewire'),
  mockSpawn = require('mock-spawn');

var docker = rewire('../../../src/cli-wrappers/docker'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test git CLI Wrapper', () => {
  beforeEach(() => {
    docker.__set__('spawn', mockSpawn());
  });

  afterEach(() => {
    docker.__set__('spawn', require('child_process').spawn);
  });

});
