---
layout: guide-admin
title: User Management
permalink: /guide/admin/user-management
---

The Clusternator server sits between the developer (client) and a cloud service
provider like Amazon's AWS.  

In order for The Clusternator to assemble deployments it requires a number of 
permissions from the cloud service provider. Chances are that these permissions 
are _too_ permissive for many people working on a given project.

By standing between the client and the cloud service provider, The Clusternator
server limits what the end user can actually do with the cloud service provider.

In order for this to work The Clusternator needs to know about users, how to 
authenticate them, and what authority they have.  By default The Clusternator 
starts with one user named `root`.  This user starts with a password provided 
during the [`bootstrap` step](/guide/installation "Installation Guide")

Each Clusternator user has an associated "Authority".  This authority determines
what the user can/cannot do with The Clusternator server.  The
[authorities guide](/guide/admin/authorities "Authorities Guide") has more
information on authorities.

Each Clusternator user also has a password, or at least a salted-hashed 
password.  More information can be found in the 
[authentication](/guide/admin/authentication "Authentication Guide") section

Using an admin account, Clusternator users can be created with:

```
clusternator create-user
```

## User Configuration

In order to keep things convenient for the clusternator end user, Clusternator
stores a little bit of information about the user.  The Clusternator keeps this
information in: `~/.clusternator-config.json`.  This file should have its
permissions set to be user read only.  Clusternator currently enforces this
restriction on write.

This file contains basic information about a user, but The Clusternator only
currently cares about the remote host, and the remote token.  Both of which
are automatically managed by `clusternator login`