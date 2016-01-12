module.exports = Object.freeze({
  name: '',
  tasks: [
    {
      'containerDefinitions': [
        {
          'volumesFrom': [],
          'portMappings': [
          ],
          'command': [],
          'environment': [{
            'name': 'NODE_ENV',
            'value': 'production'
          }],
          essential: true,
          entryPoint: [],
          links: [],
          mountPoints: [],
          memory: 512,
          name: 'nodebasic',
          cpu: 256,
          image: ''
        }
      ],
      'volumes': [],
      'family': 'default'
    }
  ]
});
