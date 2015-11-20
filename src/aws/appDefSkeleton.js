module.exports = Object.freeze({
  name: '',
  tasks: [
    {
      'containerDefinitions': [
        {
          'volumesFrom': [],
          'portMappings': [
            {
              'hostPort': 80,
              'containerPort': 8080,
              'protocol': 'tcp'
            }
          ],
          'command': [],
          'environment': [{
            'name': 'PASSPHRASE',
            'value': ''
          }],
          essential: true,
          entryPoint: [],
          links: [],
          mountPoints: [],
          memory: 256,
          name: 'nodebasic',
          cpu: 256,
          image: 'library/nginx'
        }
      ],
      'volumes': [],
      'family': 'default'
    }
  ]
});