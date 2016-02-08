'use strict';
/**
 * These functions are used as helpers for unit tests
 * @module chai
 */

const chai = require('chai');

chai.config.includeStack = true;

global.expect = chai.expect;

module.exports = {
  check,
  getFail,
  checkResolve,
  checkReject
};

/*global describe, it, expect, beforeEach, afterEach */
/**
 * @param {function(...)} fn
 * @param {function(...)} done
 */
function checkResolve(fn, done) {
  fn().then((l) => {
    check(done, () => {
      expect(true).to.be.ok;
    });
  }, getFail(done));
}

/**
 * @param {function(...)} fn
 * @param {function(...)} done
 */
function checkReject(fn, done) {
  fn().then(() => {
    check(done, () => {
      expect(true).to.be.ok;
    });
  }, getFail(done));
}

/**
  @param {function(...)} done
  @param {function(...)} fn
*/
function check(done, fn) {
  try {
    fn();
    done();
  } catch (err) {
    done(err);
  }
}

/**
  @param {function(...)} done
  @return {function(...)}
*/
function getFail(done) {
  function fail(err) {
      if (err instanceof Error) {
        done(err);
      } else {
        done(new Error('this case should not happen'));
      }
  }
  return fail;
}

