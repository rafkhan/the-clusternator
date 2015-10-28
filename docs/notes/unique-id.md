# UNIQUELY IDENTIFYING RESOURCES


## Proposition

All IDs should contain enough information for the server to identify
the resource and tear down all resources associated with them. The
ID should also be sufficient to determine when a cluster should be
terminated, as well as if it should have been terminated already.
(in the case that the clusternator server fails)


#### Format

```
typeA-([a-zA-Z0-9]*)--typeB([a-zA-Z0-9]*)

example:
pr-42--sha-2a88bd54--time-1446045609437
proj-theclusternator--pr-42--time-1446045609437
```

Each ID can contain all of the types, or a minimum of just a time
property.


#### Types of data

- Name of project
  - Filter all clusters by project
  - Maybe mandatory?
- Pull request number
- SHA of commit used to generate resources
- Time created
- github user who created resource
  - Initiated CI?
  - Created commit?
  - Pushed directly to clusternator?


## Resources needed to be tagged

#### AWS

- ECS cluster name
- EC2 boxes
- VPC
  - RT
  - ACL
- Subnet
  - Subnet per project
  - Numbered
- ECS tasks / services

#### Docker

- Image tags
- Image tags in task definition


