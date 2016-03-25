'use strict';
/**
 * Types for managing AWS EC2 SecurityGroup ID/Group Pairings
 *
 * @module aws/ec2/sg/idGroupPair
 */

module.exports = {
  create: SgUserIdGroupPair,
  SgUserIdGroupPair
};

/**
 * @param {string} groupId
 * @constructor
 * @throws {TypeError}
 */
function SgUserIdGroupPair(groupId) {
  if (!groupId) {
    throw new TypeError('SgUserIdGroupPar requires a groupId');
  }
  if (!(this instanceof SgUserIdGroupPair)) {
    return new SgUserIdGroupPair(groupId);
  }
  this.GroupId = groupId;
}

