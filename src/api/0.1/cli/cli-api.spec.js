'use strict';

require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('CLI Endpoint', () => {

  it('CLI should load', () => {
    const CLI = require('./cli-api');
    expect(CLI).to.be.ok;
  });

});
