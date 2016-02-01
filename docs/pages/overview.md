---
layout: page
title: Overview 
permalink: /overview/
---
The first feature that The Clusternator was designed for was auto-deployment on
pull request from Circle CI. The process is as follows:

![Pull Request Overview]({{ site.github.url }}{{site.baseurl}}/images/diagrams/clusternator-server-process.png "Clusternator Server Process")

_Note, in the above diagram "Docker" is a private registry hosted within a given
project's AWS account_

- Developer writes code
- Developer finalizes code, and submits PR
- PR Runs test suite
- Test Suite Passes
- Application is containerized
- Clusternator is notified
- Clusternator assembles resources on cloud service
- Service is available for human testing, demo, e2e, etc 
