---
layout: page
title: Quick Start
permalink: /guide/quick-start/
---

## Quick Start

Be sure [to have the requirements installed](/guide/requirements "The Clusternator Requirements")

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
