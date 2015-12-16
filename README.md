# THE CLUSTERNATOR

The clusternator is a tool for temporarily deploying applications on pull requests.
It uses [AWS ECS](http://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
to manage deployments, therefore **you must be using [Docker]
(https://www.docker.com/)** to run your application.


#### Install the `clusternator` CLI

```sh
npm install -g clusternator
clusternator --help
```

## [READ THE WIKI](https://github.com/rangle/the-clusternator/wiki)

## Quick Start

Quick start assumes your organization already has a running clusternator server,
configured for your organization's cloud.  This also assumes that your
organization has a _private_ GitHub repository for your project.

- `npm install -g clusternator`
- `git clone ssh://git@github.com/my-organization/my-cool-project.git`
- `cd my-cool-project`
- `clusternator init`
- Follow the prompts
- If everything goes well there will be a `CLUSTERNATOR_SHARED_KEY`, and a
`CLUSTERNATOR_AUTH` token provided at the end of the init
- Turn on CircleCI for `my-cool-project`
- _Five_ (5) environment variables need to be added:
    - `CLUSTERNATOR_AUTH` (from init)
    - `CLUSTERNATOR_SHARED_KEY` (from init)
    - `DOCKER_USER` your organization, or project's docker user name
    - `DOCKER_PASSWORD` your organization, or project's docker password
    - `DOCKER_EMAIL` your organization, or project's docker email
- Navigate to the `github.com/my-organization/my-cool-project.git` repository's
web interface
- Click `settings`
- On the left nav bar click `webhooks & services`
  - In the payload URL field enter: https://the-clusternator.my-organization.com/0.0.1/github
  - Leave the content type as JSON
  - Paste the login token in the "secret" field
  - Set "Which events would you like to trigger this webhook?" to "Everything"
  - Click Add

That's it the project will produce new deployments each time a pull request is
issued.  The project will tear down those deployments when PR's close.



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

Copyright (c) 2015 rangle.io

[MIT License][MIT]

[MIT]: ./LICENSE "Mit License"
