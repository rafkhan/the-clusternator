---
layout: page
title: Contributions and Developing
permalink: /guide/dev/
---

_yay contributions!_

## Documentation

The Clusternator takes its documentation seriously.  Documentation is made up of
a combination of API docs generated from the source code, and documentation
written by humans, for humans in the `docs` folder.

Please use [JS Doc](http://usejsdoc.org/ "JS Doc Documentation")) liberally
throughout the source.  The Clusternator's watch tasks will rebuild
documentation as you develop.  The task `npm run doc-dev` will even host those
live edits on `http://localhost:4000`

### Documentation Requirements

- `the-clusternator/docs` is now a [Jekyll Blog](http://jekyllrb.com/docs/home/ "Jekyll Static Sites")
- Jekyll can be installed on OS X `gem install jekyll` you might need ruby though

### Documentation Tasks

- `npm run doc` will build JSDOC files first, then Jekyll will build those, and 
other guides into a complete site
- `npm run doc-dev` runs a watcher and a Jekyll dev server.  This command will 
rebuild JSDoc, and Jekyll on file system changes
- `npm run doc-publish` will build, and publish a copy of the docs site. This 
requires permissions to [the documentation repo][docRepo], jekyll, and a modest 
amount of room in your `/tmp`
- `npm run doc-dev-serve` runs the Jekyll dev server, and is for _internal use_
- `npm run doc-api` builds JSDoc only, and is for _internal use_

## Code

All code is in `src/`. The CLI entry point is `bin/clusternator-cli.js`,
but includes from `lib/` (the compile destination).

There are unit tests, and repl tests.  Unit tests can be done by running
`npm test`, assuming the project has been `npm install`'d.  This is an alias
to `gulp test-unit`

Code coverage can be found _after_ tests are run, and is located in the
(generated) `coverage` folder.  Coverage includes lcov, json, and html.
