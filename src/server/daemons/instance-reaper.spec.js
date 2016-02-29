'use strict';

const Q = require('q');
const rewire = require('rewire');
const reaper = rewire('./instance-reaper');
const C = require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Projects DB', () => {
  let pm;
  let callCount;

  beforeEach(() => {
    callCount = 0;
    pm = {
      destroyExpiredPRs: () => {
        callCount += 1;
        return Q.resolve();
      }
    };
  });

  it('should return a function', () => {
    const stop = reaper(pm);
    expect(typeof stop === 'function').to.be.ok;
    stop();
  });

  it('should return a function if called twice in a row', () => {
    const f1 = reaper(pm);
    const stop = reaper(pm);
    expect(typeof stop === 'function').to.be.ok;
    expect(f1.toString() === stop.toString()).to.be.ok;
    stop();
  });

  it('should call if interval exceeded', (done) => {
    const stop = reaper(pm, 10);
    setTimeout(() => {
      C.check(done, () => expect(callCount === 1).to.be.ok);
      stop();
    }, 11);
  });

  it('should stop interval if called before a cycle hits', (done) => {
    const stop = reaper(pm, 10);
    stop();
    setTimeout(() => {
      C.check(done, () => expect(callCount === 0).to.be.ok);
      stop();
    }, 11);
  });
});