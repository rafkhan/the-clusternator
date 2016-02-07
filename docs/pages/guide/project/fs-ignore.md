---
layout: guide-project
title: .ignore Files
permalink: /guide/project/fs-ignore
---

Ignore files are extremely useful for keeping certain pieces of data outside of
things like deployments, or version control etc.  The Clusternator makes use of
these files to force exclusion of the 
[`.private`](/guide/project/fs-private "Private Directory") directory and other 
intermediate files.

The `clusternator init` command will attempt to add these ignore files to:

- `.gitignore`
- `.dockerignore`
- `.npmignore`
