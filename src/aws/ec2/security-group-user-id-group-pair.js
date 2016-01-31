'use strict';
/**
 * Types for managing AWS EC2 SecurityGroup ID/Group Pairings
 *
 * @module aws/ec2/sg/idGroupPair
 */

module.exports = {
  create
};

class SgUserIdGroupPair {
  /**
   * @param {string} groupId
   */
  constructor(groupId){
    this.GroupId = groupId;
  }
}

/**
 * @param {string} groupId
 * @returns {SgUserIdGroupPair}
 */
function create(groupId) {
  return new SgUserIdGroupPair(groupId);
}