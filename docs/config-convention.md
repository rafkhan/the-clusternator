Clusternator Recommended Configuration Conventions
==================================================

The primary configuration file for a clusternator project is 
[clusternator.json][clusternatorJson] it can be created by calling `clusternator 
init` from any directory that is, or has a parent that is a git repository.

Dockerized clusternator projects that are web applications _must_ have a project
root level Dockerfile.  This file would normally describe a front facing web
application, and needs to be tweaked on a per project (@todo ask Raf).  This
file _may_ not strictly have to be in the project root (@todo investigate)

All Dockerized clusternator projects also require one or more 
`appDefinition.json` files.  These files describe "tasks" that will eventually
be transformed into "services", which are really just running docker instances.
These task definitions pair docker images, with virtual machine resources.


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


## Dockerfile(s)

A Dockerfile is essentially a list of commands to run on an operating system to
"tune" it to your project. Dockerfiles can be as simple as a single `FROM`
instruction.

`FROM` specifies what _existing_ Docker container to base _your_ Docker
container on.  One simple example might be `FROM ubuntu:14.04` which grabs the
official Ubuntu 14.04 docker image.  That's it, that's a docker file.

There's more though.  `RUN` commands will run programs in your Docker container,
_and bake them into the build_.

`COPY` commands will _copy_ local files _into_ a docker container as it's being
built.

`EXPOSE` commands make ports public, like `EXPOSE 8080` would make the Docker
container's port #8080 accessible.  Otherwise ports are blocked.

`CMD` commands run commands _when the docker image starts_.  There are a variety
of ways to run/write `CMD`'s, but Docker recommends `CMD ['executable', 'param1'
, 'param2', 'param3', '...']`.  The advantage to the array notation is that the
process will take PID 1, and the container will end when the process ends.






[clusternatorJson]: ../src/clusternator-json-skeleton.js "All the params"
