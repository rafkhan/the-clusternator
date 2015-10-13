# SETUP

If you haven't installed the `clusternator` CLI tool yet, do so now.

```
npm install -g clusternator
```

Check and see if it installed successfully

```
clusternator --help
```


## Export AWS keys

First things first, you have to create an IAM user on your desired AWS account.
The clusternator will make requests on behalf of this user, given their
AWS credentials. You can find 
[more information on creating an IAM user here](http://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html).


**Your IAM user will require administrator permissions for now**.
[Read more on that here](http://docs.aws.amazon.com/IAM/latest/UserGuide/access_permissions.html).


Once you acquire credentials export the following environment variables.

```
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
```


## Create an app definition file

An app definition file is what will describe your application to ECS.
This includes information about CPU / RAM provisioning, mount points
on the host file system, port mappings, and more. Every editable
property can be found
[here](http://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html)


If your application doesn't have one already, you can create one with the
following command.

```
clusternator app:new > appdef.json
```

You'll revisit this file later, only after you've created the docker images
to run your application.


## Dockerize your app!

It's pretty far out of the scope of this documentation, but you can read
[the docker user guide](https://docs.docker.com/userguide/)
to help get you started.


#### Recommended images

- [NodeJS](https://hub.docker.com/_/node/)
- [nginx](https://hub.docker.com/_/nginx/) (we recommend this for the frontend)
