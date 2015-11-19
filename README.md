# THE CLUSTERNATOR

The clusternator is a tool for temporarily deploying applications on pull requests.
It uses [AWS ECS](http://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
to manage deployments, therefore **you must be using [Docker]
(https://www.docker.com/)** to run your application.


#### Install the `clusternator` CLI

```
npm install -g clusternator
clusternator --help
```

## [READ THE WIKI](https://github.com/rangle/the-clusternator/wiki)


## Developing Clusternator

_yay contributions!_

All code is in `src/`. The CLI entry point is `bin/clusternatorCli.js`,
but includes from `lib/` (the compile destination).

`bin/clusternatorCli-es5.js` is ultimately what gets run as the CLI
from `bin/clusternator.sh`.

There are unit tests, and e2e tests.  Unit tests can be done by running
`npm test`, assuming the project has been `npm install`'d.  This is an alias
to `gulp test-unit`

The e2e tests require AWS credentials, and can be run directly from gulp with
`gulp test-e2e`

The `gulp test` task will run both the unit, and e2e tests.

Code coverage can be found _after_ tests are run, and is located in the
(generated) `coverage` folder.  Coverage includes lcov, json, and html.

#### Compile ES6

`npm run build` will transform your ES6 source into ES5

`gulp transpile` will transpile `src/**/*.js` to `lib/**/*.js`

`gulp watch` will look at `src/**/*.js`, and transpile them to `lib/**/*.js`



#### Running the clusternator CLI

Run `./bin/clusternator.sh` from the root directory.

#### Project Init

Requires the Current Working Directory to be a git repository, or a subfolder
within a git repository.  The command will interactively create a
`.clusternator` file in the project\'s root directory, and will provision the
*networking* infrastructure for a project on AWS.  This currently requires an
existing VPC, and Route (AWS bootstrapping coming soon!),

## License

Copyright (c) 2015, rangle.io
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
