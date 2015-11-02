Setup & Tear Down
=================

## Project Setup

- VPC id, and Route id must be noted (.clusternator)
- Project needs a unique id (git repo name) (.clusternator)
- Project needs one or more docker image ids (.clusternator)
- Project needs one or more ec2 AMI ids, and types (.clusternator)
- Project needs one or more ecs task definitions (.clusternator)
- Project needs one or more ecs service definitions (.clusternator)
- Setup new ACL on VPCid
- Setup new Subnet, bind ACL, bind Route


## PR Setup

(relies on .clusternator info from project setup)

- create/tag new security group
- create/tag new NIC
- create/tag new ec2 image(s)
- bind nic to ec2
- bind sg to ec2
- create new ECS cluster
- bind ec2(s) to ECS cluster
- create new ECS task(s)
- create new ECS service(s)
- start system


## PR Teardown

Closing a PR triggers a tear down.  There is a TTL flag that will also tear down
a PR.

- reduce services' task counts to zero (0)
- delete services / tasks
- unbind (deregister) ec2 containers
- delete the ecs cluster
- delete the ec2 instances


## Project Teardown

- no tear down if PR's are still live
- Destroy project ACL
- Destroy project Subnet
