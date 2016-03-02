'use strict';

const rewire = require('rewire');
const gh = rewire('./git-hub');

/*global describe, it, expect, beforeEach, afterEach */
describe('Git Hub handler', () => {
  let sentStatus;
  const statusResult = { json: () => {}};
  const res = { status: () => statusResult, sendStatus: (s) => sentStatus = s };
  let event;
  let oldPr;
  let prCount;
  let pullRequest;
  let req;

  beforeEach(() => {
    req = { header: () => event };
    prCount = 0;
    pullRequest = () => prCount += 1;
    gh.__set__('pullRequest', pullRequest);
    oldPr = gh.__get__('pullRequest');
  });

  afterEach(() => {
    gh.__set__('pullRequest', oldPr);
  });

  it('should allow ping events', () => {
    event = 'ping';
    gh(null, req, res);
    expect(sentStatus).to.equal(200);
  });

  it('should allow pull request events', () => {
    event = 'pull_request';
    gh(null, req, res);
    expect(prCount).to.equal(1);
  });

  it('should forbid non pr and non ping events', () => {
    event = 'ha';
    gh(null, req, res);
    expect(prCount).to.equal(0);
  });
});
