## November 9, 2015

### Docker & Docker Platform Notes

- It seems as if Docker consider themselves [production ready][dockerReady]
- Google's services [support Docker clusters][googleDocker]
- MS's services [support Docker clusters][msDocker]


### Master Staging/QA

There is a strong use case for having a dedicated "master" copy of a
clusternated application that is _not_ torn down after a PR closes.

This should be achievable with the use of an additional set of clusternator
tags.

If an application's PR is good, then instead of tearing it down we could:

- tag all existing "master" resources to be "master.1" or similar
- tag all of the good PR's resources to be "master"
- update the route53 DNS to point to the new "master"

This gives us a simple, and fast rollback mechanism, since the "master.1"
instances would remain 'hot'.  Also it means there's no other work to do in
bringing up/rotating master...

On the other hand, it would likely be useful to be able to spin up a
clusternated application based on _any_ SHA in that repo.


### Databases, The Clusternator, and Logging

There has been some concern about Dockerized databases, and emphemarality.
There is a [post on Stackoverlfow][dockerDatabase] that makes a case for
Dockerizing databases.  The post author is also working on a FLOSS project
called [Flocker][flocker], which seems to simplify some container management,
and migration issues.

Docker [has their own][dockerDBStorage] recommendations on data management.
These recommendations _seem_ very straightforward.

In the AWS world, [Elastic Block Store][EBS] volumes are persistent, easy to
back up, and easy to mount, could be used as persistent storage for Clusternator
containers. (Flocker _might_ be able to abstract all this away)

Possible uses:

- EBS for DB Test data
- EBS for Staging/QA DB
- EBS for Production DB
- EBS for (inital) logs for each PR
- EBS for persistent caching services

Possible complications:

- Backups, especially for databases. [Snapshotting EBS][BackupWithEbs] works
well, but the linked method _can_ also cause DB locks that nobody wants


### Production

Production seems like it has a lot of uncertainty, as different consumers
will have different needs in production.

Assumed Requirements:

- Dedicated/Isolated VPC (or similar) area for production environments
- Simple/Fast rollback options
- Multi-availability zones, and fault tolerant architecture
- Isolated Services/Micro services - possibly having DB's in restricted subnets
- Rigorous database backups

On the AWS level it seems like clusternator could do this.  We would need to
devise a configuration scheme.

One down side is that it would likely be really nice to have the staging/QA
environment be an _exact_ replica of production, and isolating subnets causes
a conflict with the _current_ dockernator resource scheme.  If the Clusternator
resource scheme were altered to use a VPC per project, instead of a subnet (or
two in the case of multi-AZ) this would not be a problem.  However the VPC per
project scheme requires service adjustments from AWS.


### Bare Virtual Metal, and S3

Docker is pretty awesome, and it abstracts away a _lot_ of issues, especially
with respect to backend development having a consistent environment.

The downside to Docker is that it's another layer of containerization, and it
requires configuration, and dockerization of applications.

AWS's Docker (ECS) service requires resources that a bare "virtual metal" server
would need.  Meaning a simple node service could be spun up directly on an AWS
virtual machine _without_ a docker agent, AWS services, AWS tasks, or an AWS
ECS Agent.  The cool part is that the code for this already exists, with the
exception of the `git pull`/`npm install` step.

For purely static sites Amazon's S3 _might_ be the most economical option
available.  Launching HTTP S3 websites is _very_ easy to do manually, there
would be some work in automating it.  Launching HTTPS S3 websites is similar,
but requires a CloudFront service, and an HTTPS cert, but is otherwise quite
straightforward.  Tying these resources to a DNS entry is almost the exact same
as tying an EC2, or ECS service to DNS.



[msDocker]: https://azure.microsoft.com/en-us/blog/tag/docker/ "MS Azure's Docker Solutions"
[googleDocker]: https://cloud.google.com/compute/docs/containers?hl=en "Google's Docker Solutions"
[dockerReady]: https://blog.docker.com/2015/06/docker-ready-for-production/ "Docker, Allegedly Production Ready"
[dockerDatabase]: http://stackoverflow.com/questions/25047986/does-it-make-sense-to-dockerize-containerize-databases "Dockerized Databases"
[flocker]: https://clusterhq.com/flocker/introduction/ "Flocker, Container Management"
[dockerDBStorage]: http://docs.docker.com/engine/userguide/dockervolumes/ "Managing Data"
[EBS]:https://aws.amazon.com/ebs/ "Amazon's Elastic Block Storage"
[BackupsWithEBS]:https://aws.amazon.com/articles/1663 "Backing up EBS database volumes"
