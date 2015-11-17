Clusternator Recommended Configuration Conventions
==================================================

The primary configuration file for a clusternator project is 
[clusternator.json][clusternatorJson] it can be created by calling `clusternator 
init` from any directory that is, or has a parent that is a git repository.

Dockerized clusternator projects that are web applications _must_ have a project
root level Dockerfile.  This file would normally describe a front facing web
application, and needs to be tweaked on a per project (@todo ask Raf)

All Dockerized clusternator projects also require `appDefinition.json`


## clusternator.json

The `clusternator init` command will walk through all of the required options
for a given project, and will write a `clusternator.json` in the git
repository's root directory.  The command will not overwrite.

There are a few mandatory attributes in `clusternator.json`:

- projectId is a string that should match the name of a project's git repository
projectId's should be unique within a clusternator managed VPC
- private is _not strictly_ mandatory.  Private is an array of strings to treat
for inclusion in `clusternator make-private`, and `clusternator read-private`
- appDefs are strings contining the path/filename of an appDefinition file, pr
is required






[clusternatorJson]: ../src/clusternator-json-skeleton.js "All the params"
