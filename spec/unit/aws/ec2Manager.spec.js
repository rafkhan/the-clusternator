'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants'),
  ec2Mock = require('./ec2-mock');

var Ec2 = rewire('../../../src/aws/ec2Manager');
require('../chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('ec2Manager', () => {
  var ec2;

  beforeEach(() => {
    ec2 = Ec2(ec2Mock);
  });

  it('create should throw if not given a projectId or pr #', () => {
    expect(() => {
      ec2.create();
    }).to.throw(Error);
  })

  it('destroy should throw if not given a projectId or pr #', () => {
    expect(() => {
      ec2.destroy();
    }).to.throw(Error);
  })
});
