var setup = require('./setup'),
  Task = require(setup.path('aws', 'taskDefinitionManager.js'));

module.exports = Task(setup.getEcs());
