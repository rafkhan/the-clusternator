'use strict';

const Q = require('q');
const rewire = require('rewire');
const pr = rewire('./pull-request');

/*global describe, it, expect, beforeEach, afterEach */
describe('Git Hub PR Handler', () => {
  let sentStatus;
  const statusResult = {
    json: () => {
    }
  };
  const res = {
    status: () => statusResult,
    sendStatus: (s) => sentStatus = s,
    locals: { projectName: 'test' }
  };
  let pm;
  let req;
  let error;
  let oldServerUtil;

  beforeEach(() => {
    pm = {
      destroyPR: () => Q.resolve()
    };
    req = {
      body: {
        action: 'closed',
        pull_request: {
          number: 72
        }
      }
    };
    oldServerUtil = pr.__get__('serverUtil');
    error = 0;
    pr.__set__('serverUtil', { sendError: (res, code, err) => {
      error += 1;
    }});
  });

  afterEach(() => {
    pr.__set__('serverUtil', oldServerUtil);
  });

  it('should error if action is not closed', () => {
    req.body.action = 'test';
    pr(pm, req, res);
    expect(error).to.equal(1);
  });

  it('should succeed if is closed', () => {
    pr(pm, req, res);
    expect(error).to.equal(0);
  });

});
