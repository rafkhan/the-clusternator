'use strict';

const rewire = require('rewire');

const aws = rewire('./aws');
require('../chai');


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: AwsWrapper', () => {
  it('should be a constructor', () => {
    const a = new aws.create({}, '1');
  });

  it('should not require `new`', () => {
    const a = aws.create({}, '1');
  });

  it('should expose ddb', () => {
    const a = aws.create({}, '1');
    expect(a.ddb).to.be.ok;
  });

  it('should expose elb', () => {
    const a = aws.create({}, '1');
    expect(a.elb).to.be.ok;
  });

  it('should expose ec2', () => {
    const a = aws.create({}, '1');
    expect(a.ec2).to.be.ok;
  });

  it('should expose ecr', () => {
    const a = aws.create({}, '1');
    expect(a.ecr).to.be.ok;
  });

  it('should expose iam', () => {
    const a = aws.create({}, '1');
    expect(a.iam).to.be.ok;
  });

  it('should expose r53', () => {
    const a = aws.create({}, '1');
    expect(a.r53).to.be.ok;
  });

});
