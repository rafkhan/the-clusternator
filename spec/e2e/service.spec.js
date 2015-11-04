var setup = require('./setup'),
Service = require(setup.path('aws', 'taskServiceManager.js'));

module.exports = Service(setup.getEcs());
