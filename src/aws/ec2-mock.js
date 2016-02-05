'use strict';

var Q = require('q');

var descriptions = {
  vpcs: [],
  subnets: [],
  routeTables: [],
  securityGroups: [],
  networkAcls: [],
  createTags: [],
  networkAclEntries: [],
  assocRouteTables: [],
  instances: []
};

function setDescription(id, val) {
  descriptions[id] = val;
}

function setDescribeInstances(val) {
  setDescription('instances', val);
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

function setCreateNetworkAclEntry(val) {
  setDescription('networkAclEntries', val);
}

function setDescribeSecurityGroups(val) {
  setDescription('securityGroups', val);
}

function setDescribeRouteTables(val) {
  setDescription('routeTables', val);
}

function setAssociateRouteTable(val) {
  setDescription('assocRouteTables', val);
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

function describeInstances(params, callback) {
  describe('instances', params, callback);
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

function createNetworkAclEntry(rule, callback) {
  if (descriptions.networkAclsEntries instanceof Error) {
    callback(descriptions.networkAclsEntries);
  } else {
    callback(null);
  }
}

function associateRouteTable(assoc, callback) {
  if (descriptions.assocRouteTables instanceof Error) {
    callback(descriptions.assocRouteTables);
  } else {
    callback(null);
  }
}

function replaceNetworkAclAssociation() {
  return Q.resolve();
}

function createNetworkAcl(p, cb) {
  cb(null, { NetworkAcl: { NetworkAclId: 'test' }});
}

function deleteNetworkAcl(p, cb) {
  cb(null, { NetworkAcl: { NetworkAclId: 'test' }});
}

function authorizeSecurityGroupIngress(p, cb) {
    cb(null);
}

function authorizeSecurityGroupEgress(p, cb) {
    cb(null);
}

module.exports = {
  setCreateTags,
  createTags,
  setDescribeVPCs,
  describeVpcs,
  setDescribeSubnets,
  describeSubnets,
  setDescribeRouteTables,
  describeRouteTables,
  setDescribeNetworkAcls,
  describeNetworkAcls,
  setDescribeSecurityGroups,
  describeSecurityGroups,
  setCreateNetworkAclEntry,
  createNetworkAclEntry,
  setAssociateRouteTable,
  associateRouteTable,
  replaceNetworkAclAssociation,
  createNetworkAcl,
  deleteNetworkAcl,
  authorizeSecurityGroupEgress,
  authorizeSecurityGroupIngress,
  describeInstances
};
