# THE CLUSTERNATOR

_Status_: alpha

The Clusternator attempts to make managing deployments of containers easy for 
front end developers.  Specifically The Clusternator was built to fill the
deoployment challenges of CI setups.

The current version of The Clusternator uses Docker containers on Amazon's AWS
infrastructure.  

There are two components to The Clusternator.  The command line client, and the
server.  Although it is not _strictly_ necessary to run a server it is the
target use case, and use of a clusternator server will be assumed, unless 
otherwise noted.

## Client Requirements

- [NodeJs](https://nodejs.org/en/ "Node JS") >= 12
- [GPG](https://www.gnupg.org/ "GNU Privacy Guard")  ~1.4 not included in OS X 
or Windows
- OpenSSH (included on OS X, GNU/Linux)
- [Docker](https://docker.io) (optional)

## Server Requirements

- [NodeJs](https://nodejs.org/en/ "Node JS") >= 4.2.6

The server is designed to be deployed as a Docker container, so in a way, 
Docker is a requirement.

## Installation (Client)

Make sure your system has the third party requirements, then from a shell run:

```bash
npm install -g clusternator
```

## Installation (Server)

_note this is *NOT* yet completely implemented_

These instructions assume that by installing the server the user will be using
a clusternator CLI client to deploy a clusternator server to a cloud service.

```bash
clusternator bootstrap
```

There will be a series of prompts.  Once this is done other clients will be
able to start using your clusternator server.


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
`GITHUB_KEY`  provided at the end of the init
- Turn on CircleCI for `my-cool-project`
- _One_ (1) environment variables need to be added:
    - `CLUSTERNATOR_SHARED_KEY` (from init)
- Navigate to the `github.com/my-organization/my-cool-project.git` repository's
web interface
- Click `settings`
- On the left nav bar click `webhooks & services`
  - In the payload URL field enter: https://the-clusternator.my-organization.com/0.1/github
  - Leave the content type as JSON
  - Paste the login token in the "secret" field
  - Set "Which events would you like to trigger this webhook?" to "Everything"
  - Click Add

That's it the project will produce new deployments each time a pull request is
issued.  The project will tear down those deployments when PR's close.


## Developing Clusternator

_yay contributions!_

All code is in `src/`. The CLI entry point is `bin/clusternator-cli.js`,
but includes from `lib/` (the compile destination).

There are unit tests, and repl tests.  Unit tests can be done by running
`npm test`, assuming the project has been `npm install`'d.  This is an alias
to `gulp test-unit`

Code coverage can be found _after_ tests are run, and is located in the
(generated) `coverage` folder.  Coverage includes lcov, json, and html.



## License

Copyright (c) 2015 rangle.io

[MIT License][MIT]

[MIT]: ./LICENSE "Mit License"
