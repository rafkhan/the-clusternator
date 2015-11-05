var setup = require('./setup'),
Task = require(setup.path('aws', 'taskServiceManager.js'));

module.exports = Task(setup.getEcs());
