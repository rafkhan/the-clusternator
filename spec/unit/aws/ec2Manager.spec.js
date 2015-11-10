'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants'),
  ec2Mock = require('./ec2-mock');

var Ec2 = rewire('../../../src/aws/ec2Manager');
require('../chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('ec2Manager', function() {
  var ec2;

  beforeEach(function() {
    ec2 = Ec2(ec2Mock);
  });

  it('create should throw if not given a projectId or pr #', function() {
    try {
      ec2.create();
      expect('this should not happen').to.be(undefined);
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  })

  it('destroy should throw if not given a projectId or pr #', function() {
    try {
      ec2.destroy();
      expect('this should not happen').to.be(undefined);
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  })
});
