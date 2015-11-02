var setup = require('./setup'),
Nic = require(setup.path('aws', 'nicManager.js'));

module.exports = Nic(setup.getEc2());
