'use strict';

const Q = require('q');

const data = {
  defaultVPC: {
    CidrBlock: '192.168.0.0'
  }
};

function findProject() {
  return Q.resolve(data.defaultVPC);
}

function getVpc() {
  return {
    data,
    findProject
  };
}

module.exports = getVpc;
