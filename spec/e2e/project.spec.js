var setup = require('./setup'),
Project = require(setup.path('projectManager.js'));

module.exports = Project(setup.getEc2(), setup.getEcs());
