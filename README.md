# THE CLUSTERNATOR

## Setup

#### Install the `clusternator` CLI

```
git clone https://github.com/rangle/the-clusternator.git
cd the-clusternator
npm install . -g
```

Check and see if it installed successfully

```
clusternator --help
```


#### Export AWS keys

```
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
```

#### Create app definition file

In your project's root folder:

```
clusternator app:new > YOUR_APP_DEFINITION.json
```

### AWS console setup

#### Create VPC
- https://console.aws.amazon.com/vpc/home
  - On the Step 1: Select a VPC Configuration page, ensure that VPC with a Single Public Subnet is selected, and choose Select.

#### Create security group
- Create a security group associated with the VPC you just made

#### Create network interface
- Create network interface associated with SG you just made
