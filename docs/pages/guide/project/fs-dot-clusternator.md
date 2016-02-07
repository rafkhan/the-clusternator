---
layout: guide-project
title: .clusternator Directory
permalink: /guide/project/fs-dot-clusternator
---

The Clusternator uses the `.clusternator` directory to store deployment scripts
useful for decrypting [`.private`](/guide/project/fs-private "Private Directory")
and tracking the `shasum` of the `.private` directory.

Some of these files could be eliminated by requiring an 
`npm install -g clusternator` in things like the test environment, but 
_avoiding_ an `npm install` is probably faster.  Currently these scripts _only_
depend on `bash` and `npm install aws-sdk`; The Clusternator has many more
dependencies.

