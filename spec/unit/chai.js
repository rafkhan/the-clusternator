var chai = require('chai');

chai.config.includeStack = true;

global.expect = chai.expect;

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

module.exports = {
  check,
  getFail
};
