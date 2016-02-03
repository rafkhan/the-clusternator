---
layout: guide-admin
title: Authentication
permalink: /guide/admin/authentication
---

The Clusternator currently supports two two authentication mechanisms:

- passwords
- bearer tokens

## Passwords

The Clusternator supports passwords. Passwords are used (transparently to the
user) to acquire bearer tokens.

In real world practice, Clusternator users would

```bash
clusternator login
```

Upon success, The Clusternator would locally save a bearer token.  Then use it
to execute subsequent commands.

Users can change their password with:

```bash
clusternator passwd
```

## Extensions

The Clusternator uses a 
[library called Passport](http://passportjs.org/ "Passport") and can be
extended.  Using GitHub to authenticate is something we're really hoping to
have the time to implement soon.
