'use strict';

var descriptions = {
  vpcs: [],
  subnets: [],
  routeTables: []
};

function setDescription(id, val) {
  descriptions[id] = val;
}

function setDescribeVPCs(val) {
  setDescription('vpcs', val);
}

function setDescribeSubnets(val) {
  setDescription('subnets', val);
}

function setDescribeRouteTables(val) {
  setDescription('routeTables', val);
}

function describe(id, params, callback) {
  if (descriptions[id] instanceof Error) {
    callback(descriptions[id]);
  } else {
    callback(null, descriptions[id]);
  }
}

function describeVpcs(params, callback) {
  describe('vpcs', params, callback);
}

function describeSubnets(params, callback) {
  describe('subnets', params, callback);
}

function describeRouteTables(params, callback) {
  describe('routeTables', params, callback);
}

module.exports = {
  setDescribeVPCs: setDescribeVPCs,
  describeVpcs: describeVpcs,
  setDescribeSubnets: setDescribeSubnets,
  describeSubnets: describeSubnets,
  setDescribeRouteTables: setDescribeRouteTables,
  describeRouteTables: describeRouteTables
};
