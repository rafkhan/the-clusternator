Clusternator Stories
====================

## Clusternator Itself

- Client (n)
- Server 1x (per project?)
- Deployment (n)

## Clusternator Local Requirements

- GitHub or Circle CI hook/POST
- Local Docker config
- Read Manual

### Stories

#### Initial Story

(Part of project initialization?)

- Developer configure their AWS credentials
- Developer runs clusternator init
  - Interactive or config file?
- Provisions VPC, subnets, route tables, etc
- Assign IAM roles?


#### Listing VPCs/clusters

- Developer needs to know if there is an existing VPC for the project
- Developer runs clusternator <project> list
- More or less lists ECS resources in project
- Listing code?


#### Basic Success Story

- Developer makes dockerized app
- Developer pushes feature branch
- Circle CI or GitHub notifies server
- Runs Docker against provided config
- Developer does their tests
- PR accepted, hook to cleanup
- Clusternator cleans up


#### Manual Clean Up

- Developer runs clusternator <project> clean
- ECS resources are released VPC lives


#### TTL Clean Up

- Server has list of live clusternations
- Server periodically polls clusternations
- Server cleans expired culsters, and notifies
- ECS resources are released VPC lives


#### End of Project Clean Up

- Developer runs clusternator <project> terminate
- *All* AWS Resources are released
