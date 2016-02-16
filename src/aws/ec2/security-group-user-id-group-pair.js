'use strict';
/**
 * Types for managing AWS EC2 SecurityGroup ID/Group Pairings
 *
 * @module aws/ec2/sg/idGroupPair
 */

module.exports = {
  create: SgUserIdGroupPair
};

/**
 * @param {string} groupId
 * @constructor
 */
function SgUserIdGroupPair(groupId) {
  this.GroupId = groupId;
}

