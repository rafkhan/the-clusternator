# Steps taken when launching clusternator server

- Read configuration (from file / ENV)
- Determines
  - AWS credentials (w/ dry run?)
  - Existence of VPC, RT, ACL
  - Security groups


## On request

- Obtain information about current push
  - Project name
  - unique ID
  - task definitions


- Find appropriate subnet for project
  - Look for "project" tag matching project
  - If no subnet exists for project, create one

## Request body format

```
{
  "resourceId": "pr-42--time-1234",
  "taskdefinition": [
    {
      "image": "user/repo:$ID",
      "cpu": 256
    },
    {
      "image": "user/repo2:latest",
      "cpu": 256
    },
  ]
}
```
