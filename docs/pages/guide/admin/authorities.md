---
layout: page
title: Authorities
permalink: /guide/admin/authorities
---

The current authorities model in The Clusternator is quite primitive.  Currently
there is no _implemented_ concept of project ownership. 
 
There is however a primitive mechanism for restricting which commands users can
execute.

- Each user is assigned an authority number
- Authority numbers are 0, 1, and 2
- The lower the number the higher the authority
- Each command (except login/logout/passwd) supported by The Clusternator REST 
API has a number assigned to it in The Clusternator server config file
- If a user's authority number is _less than or equal to_ the command's value
then the user _has_ authority to run the command

For example:

- Hypothetical user named Pat
- Pat has an authority of 2, the _least_ authority
- project/create is an endpoint with a required authority of 1
- If Pat executes project/create Pat will get a 403 (forbidden)

- Hypothetical user named Jan
- Jan has an authority of 1, the middle authority
- project/create is an endpoint with a required authority of 1
- If Jan executes project/create Jan will be authorized to execute the command

For a list of your clusternator's authorities execute 
`clusternator list-authorities`
