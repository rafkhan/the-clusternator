---
layout: guide-project
title: Clusternator Server Project State
permalink: /guide/project/remote-state
---

There are two types of remote state that The Clusternator is aware of.

- The actual state of virtual machines and containers used on a cloud service
- Some data about a given project

## Project Data

Project data consists of a few things required to make Clusternator deployments
integrate with CI systems.  Each project has:

- Shared Secret Key
- Project access token
- GitHub Key

See `clusternator project --help` for more comamand information

###  Shared Secret Key

The shared secret key is used to decrypt/encrypt the contents of
[`.private`](/guide/project/fs-private "Private Directory").  This key is
accessible to project team members transparently.  However they can manually
ask for the key with `clusternator project shared-key` from somewhere within
the project's directory structure.

The shared key can also be manually revoked, and re-issued with:
`clusternator project reset-shared-key`

### Project Authentication Token

The project authentication token is only issued _once_, but can be revoked and 
reissued on demand.

`clusternator init` will display the token at then end of a successful project
init.

`clusternator project reset-auth-token` will revoke the old token, create a new
token, and return it to the user

`clusternator project create-data` will reset _all_ the project's keys/tokens
and display the new ones to the user

_note_ The Clusternator is not capabale of storing an actual copy of this token
so there is no way to view one on request, it can only be revoked/reissued.


### GitHub Key

The GitHub key is used to encrypt/authenticate incoming requests from GitHub.
The key is issued initially on `clusternator init` but can be manually reset
with `clusternator project reset-git-hub-key`.  The key can be requested by
a Clusternator user with  `clusternator project git-hub-key`


## Virtual Resources State

Information specific to allocated resources are accessed by The Clusternator
directly querying the underlying cloud service.  
