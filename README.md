# THE CLUSTERNATOR

#### Install the `clusternator` CLI

```
npm install -g clusternator
```

Check and see if it installed successfully

```
clusternator --help
```

#### [Local Setup](docs/setup.md)
#### [Network Configuration](docs/network.md)
#### [Deploying & Caveats](docs/deploy.md)


## App Definition File

This is the _hard part_ (kinda, not really). The application definition file
(which we will call `appdef.json`) is a JSON file which specifies the following
details about how to run your application:

- Docker images running
- Environment variables
- Links between containers
- Physical -> virtual port mappings
- Data volumes and their physical mount points
  (hard drives, can share between containers)
- CPU and RAM on the physical EC2 instance

You can create an `appdef.json` by running `clusternator app:new > appdef.json`.
More information about the parameters can be found at
http://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html


## Private Application Configurations

Chances are any sophisticated application will need to connect to one or more services that _require_ authentication.
Currently the _best implemented_ way of working with the clusternator, and configurations is to keep the configurations
in an _encrypted file_ in the repository.

Clusternator has some commands to help with AES256 encrypting your configs, and automating the process:

To generate a cryptographically secure passphrase:

```
clusternator make-pass
```

To encrypt all of the assets listed in a given project's `clusternator.json`'s `private` field:

```
clusternator make-private -p some-long-passphrase-over-thirty-characters
```

To decrypt all of the assets (if they've already been encrypted)

```
clusternator read-private -p some-long-passphrase-over-thirty-characters
```

Ideally this process should be automated with a pre-commit git hook, and post commit.  That way the developer can
work freely with local Dockers, or VM's, and not have to worry about committing private credentials.

Clusternator currently recommends keeping all private credentials in a `project-root/.private` folder to keep intentions
clear.


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
