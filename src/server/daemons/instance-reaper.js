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
 * @param {number=} interval override
 * @returns {stop}
 */
function watch(pm, interval) {
  if (intervalID) {
    return stop;
  }
  interval = interval || EC2_BILLING_PERIOD;

  intervalID = setInterval(pm.destroyExpiredPRs, interval);

  function stop() {
    if (intervalID) {
      clearInterval(intervalID);
      intervalID = null;
    }
  }

  return stop;
}

