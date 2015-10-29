Container Relationships
=======================

These are rough notes to help make sense of AWS, and Docker terminology

## AWS Containers

- aws ecs task (a running docker image, describe by a task definition)
- aws ecs service (a group of 'n' aws tasks, describe by service definition)
- aws ecs services run on an aws ecs cluster
- aws ecs services use task definitions to assign tasks to container instances


## AWS ECS Cluster

- aws ecs container instance (aws ec2 running ecs agent, registers with cluster)
- aws ecs cluster (collection of aws ecs container instances)
- aws ecs containers _should_ belong to a VPC

## AWS VPC

- aws ecs container instances run in a subnet on a VPC
- subnets run in an availability zone
