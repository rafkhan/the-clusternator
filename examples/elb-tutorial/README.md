# ELB setup notes

### Things to note

- All containers in one task definition run on a single EC2 instance
- 1 ELB per service


## STEPS

- Create VPC (10.0.0.0/25)
  - **I HAD TO USE VPC WIZARD TO CREATE INTERNET GATEWAY**

- Create subnets
  - Subnet A, made by default, w/ correct route table (10.0.0.0/25)
  - Subnet B, select same RT as SN A (10.0.0.128/25)

- Create security group
  - in same VPC



```
# CREATE BOX IN subnet-142a1b3f AND SG

clusternator cluster:new -c ELB-TUTORIAL-1 -a appdef.json -k clusternator-test-keypair -n subnet-142a1b3f -g sg-2b7ad84d


# CREATE BOX IN subnet-602a1b4b WITH MATCHIN SG AND CLUSTERC

clusternator cluster:new -c ELB-TUTORIAL-1 -a appdef.json -k clusternator-test-keypair -n subnet-602a1b4b -g sg-2b7ad84d
```


#### ISSUES
- Different services were created by clusternator
  - Therefore can not load balance using ECS config

- Had to delete 1 service, raised desired count of remaining
  service to 2


