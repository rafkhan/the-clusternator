'use strict';

var descriptions = {
  vpcs: [],
  subnets: [],
  routeTables: [],
  securityGroups: [],
  networkAcls: [],
  createTags: []
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

function setDescribeNetworkAcls(val) {
  setDescription('networkAcls', val);
}

function setDescribeSecurityGroups(val) {
  setDescription('securityGroups', val);
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

function describeSecurityGroups(params, callback) {
  describe('securityGroups', params, callback);
}

function describeNetworkAcls(params, callback) {
  describe('networkAcls', params, callback);
}

function setCreateTags(val) {
  setDescription('createTags', val);
}

function createTags(params, callback) {
  if (descriptions.createTag instanceof Error) {
    callback(descriptions.createTag);
  } else {
    callback(null);
  }
}

module.exports = {
  setCreateTags: setCreateTags,
  createTgs: createTags,
  setDescribeVPCs: setDescribeVPCs,
  describeVpcs: describeVpcs,
  setDescribeSubnets: setDescribeSubnets,
  describeSubnets: describeSubnets,
  setDescribeRouteTables: setDescribeRouteTables,
  describeRouteTables: describeRouteTables,
  setDescribeNetworkAcls: setDescribeNetworkAcls,
  describeNetworkAcls: describeNetworkAcls,
  setDescribeSecurityGroups: setDescribeSecurityGroups,
  describeSecurityGroups: describeSecurityGroups
};
