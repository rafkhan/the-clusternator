'use strict';
/**
 * This module deals with TTL/Expiry based destruction of AWS resources
 *
 * @module server/daemons/instanceReaper
 */

const EC2_BILLING_PERIOD  = 10000 * 60 * 60;

let intervalID = null;

module.exports = watch;

/**
 * @param {{ destroyExpiredPRs: function(...) }} pm
 * @returns {stop}
 */
function watch(pm) {
  if (intervalID) {
    return stop;
  }

  intervalID = setInterval(pm.destroyExpiredPRs, EC2_BILLING_PERIOD);

  function stop() {
    if (intervalID) {
      clearInterval(intervalID);
      intervalID = null;
    }
  }

  return stop;
}

