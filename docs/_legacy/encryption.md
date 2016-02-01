---
layout: page
title: Local Encryption
permalink: /guide/encryption/
---
Chances are any sophisticated application will need to connect to one or more services that _require_ authentication.
Currently the _best implemented_ way of working with the clusternator, and configurations is to keep the configurations
in an _encrypted file_ in the repository.

Clusternator has some commands to help with AES256 encrypting your configs, and automating the process:

To generate a cryptographically secure passphrase:

```
clusternator make-pass
```

To encrypt all of the assets listed in a given project's `clusternator.json`'s `private` field:

```
clusternator make-private -p some-long-passphrase-over-thirty-characters
```

To decrypt all of the assets (if they've already been encrypted)

```
clusternator read-private -p some-long-passphrase-over-thirty-characters
```

Ideally this process should be automated with a pre-commit git hook, and post commit.  That way the developer can
work freely with local Dockers, or VM's, and not have to worry about committing private credentials.

Clusternator currently recommends keeping all private credentials in a `project-root/.private` folder to keep intentions
clear.
