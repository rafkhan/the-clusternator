---
layout: guide-project
title: .private Directory
permalink: /guide/project/fs-private
---

The Clusternator makes extensive use of a directory (typically) called 
`.private`.  This directory is not directly included in the project fs, instead
it is encrypted with `gpg` and the `CLUSTERNATOR_SHARED_KEY` and stored in the
project as `clusternator.tar.gz.asc`