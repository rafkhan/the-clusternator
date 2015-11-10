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
  callback(data.hostedZone);
}

module.exports = {
  data: data,
  getHostedZone
};
