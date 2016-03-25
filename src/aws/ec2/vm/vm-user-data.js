'use strict';

const SETUP_SSH = 'mkdir -p /home/ec2-user/.ssh';
const CHOWN_SSH ='chown -R ec2-user:ec2-user /home/ec2-user/.ssh && chmod -R ' +
  'go-rwx /home/ec2-user/.ssh';
const OUTPUT_SSH = '>> /home/ec2-user/.ssh/authorized_keys';


module.exports = {
  getEcs: getECSContainerInstanceUserData,
  helpers: {
    processSSHKeys,
    stringArrayToNewLineBase64
  }  
};

/**
 * @param {string[]} keys
 * @returns {string[]}
 * @throws {TypeError}
 */
function processSSHKeys(keys) {
  if (!Array.isArray(keys)) {
    throw new TypeError('processSSHKeys requires an array of strings');  
  }
  return [SETUP_SSH].concat(keys.map((key) => {
    return `echo "\n${key}" ${OUTPUT_SSH}`;
  }).concat(CHOWN_SSH));
}

/**
 * @param {string} clusterName
 * @param {Array.<string>=} sshKeys
 * @returns {string}
 * @throws {TypeError}
 */
function getECSContainerInstanceUserData(clusterName, sshKeys) {
  if (!clusterName) {
    throw new TypeError('getECSContainerInstanceUserData requires a ' +
      'clustername');
  }
  let data = ['#!/bin/bash',
    'echo ECS_CLUSTER=' + clusterName + ' >> /etc/ecs/ecs.config;'
  ];

  if (Array.isArray(sshKeys)) {
    data = data.concat(processSSHKeys(sshKeys));
  }
  return stringArrayToNewLineBase64(data);
}

/**
 * @param {string[]} arr
 * @return {string}
 * @throws {TypeError}
 */
function stringArrayToNewLineBase64(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('stringArrayToNewLineBase64 requires an array of ' +
      'strings');
  }
  const buf = new Buffer(arr.join('\n'));
  return buf.toString('base64');
}
