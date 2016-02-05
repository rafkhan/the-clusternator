'use strict';
var Q = require('q');

var data = {
  hostedZone: {
    HostedZone: {
      Name: 'example.com.'
    }
  }
}

function getHostedZone(params, callback) {
  callback(null, data.hostedZone);
}

function listHostedZones(params, callback) {
  callback(null);
}

module.exports = {
  data: data,
  getHostedZone,
  listHostedZones
};
