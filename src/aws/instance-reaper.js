'use strict';
/**
 * This module deals with TTL/Expiry based destruction of AWS resources
 *
 * @module aws/instanceReaper
 */

const EC2_BILLING_PERIOD  = 10000 * 60 * 60;
const config = require('../config')();
const pm = require('./project-init')(config);

let intervalID;

function start() {
  if (!intervalID) {
    intervalID = setInterval(pm.destroyExpiredPRs, EC2_BILLING_PERIOD);
  }
}

function stop() {
  if (intervalID) {
    clearInterval(intervalID);
    intervalID = undefined;
  }
}

module.exports = {
  start,
  stop
};
