'use strict';
/**
 * Types required to manage AWS ELB Port Listeners
 *
 * @module aws/elb/portListener
 */

module.exports = {
  create: ElbPortListener
};

/**
 * @param {number} instancePort
 * @param {number} publicPort
 * @param {string} instanceProtocol
 * @param {string} publicProtocol
 * @param {string=} sslCertId
 */
function ElbPortListener(instancePort, publicPort, instanceProtocol,
                         publicProtocol, sslCertId){
  if (!(this instanceof ElbPortListener)) {
    return new ElbPortListener(instancePort, publicPort, instanceProtocol,
      publicProtocol, sslCertId);
  }
  this.InstancePort= instancePort;
  this.LoadBalancerPort= publicPort;
  this.InstanceProtocol= instanceProtocol;
  this.Protocol= publicProtocol;
  this.SSLCertificateId= sslCertId || '';
}
