---
layout: page
title: Installation
permalink: /guide/installation/
---

There are two components to The Clusternator.  The command line client, and the
server.  Although it is not _strictly_ necessary to run a server it is the
target use case, and use of a clusternator server will be assumed, unless 
otherwise noted.

## Installation (Client)

Make sure your system has the third party requirements, then from a shell run:

```bash
npm install -g clusternator
```

## Installation (Server)

_note this is *NOT* yet completely implemented_

These instructions assume that by installing the server the user will be using
a clusternator CLI client to deploy a clusternator server to a cloud service.

Having a locally installed copy of Docker is required for this.

```bash
clusternator bootstrap
```

There will be a series of prompts.  Once this is done other clients will be
able to start using your clusternator server.
