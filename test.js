var s = require('./src/cli-wrappers/ssh-keygen');

s('./tmp/doood').then(() => {
  console.log('yay');
}, (err) => { 
  console.log ('boo', err); 
});
