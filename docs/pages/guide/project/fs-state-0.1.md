---
layout: guide-project
title: Project File System State
permalink: /guide/project/file-system-state
---

Every Clusternated project has two broad types of "state" or configuration 
associated with it. This document is concerned with state in the codebase of a
project itself.  This guide will use the term project filesystem, or project fs
to refer to the files at the `HEAD` of a git master branch in a project.

The Clusternator uses the project fs in order to transform the project's git
repository into a deployable instance of an application that can be instantiated
as a dev environment, testing environment, a production environment, or
something else, like staging.

Currently The Clusternator makes extensive use of the project fs to achieve
this goal.  In the future there are plans to trim this down, and better leverage
[remote state](/guide/project/remote-state "Remote State")

- [Ignore](/guide/project/fs-ignore ".ignore files") files
- [.clusternator](/guide/project/fs-dot-clusternator ".clusternator directory") directory
- [clusternator.json](/guide/project/fs-clusternator-json ".clusternator.json file") file
- [.private](/guide/project/fs-private ".private files") directory
- [Test config](/guide/project/fs-test-config "Test files like circle.yml") files
- [Container files](/guide/project/fs-container-files "Container Files") like Dockerfile(s)
