var setup = require('./setup'),
Acl = require(setup.path('aws', 'aclManager.js'));

module.exports = Acl(setup.getEc2(), setup.testVPC);
