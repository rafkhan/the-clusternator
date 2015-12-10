#!/bin/bash

# please only use ephemeral keys here!!
token="root:fWiufF4tYohrdnsddb26tPMqLVzGCZ8bonxkjChOT0YN_139bCp8ttoTQMON0og9tFIobvCkvHOQMJVQbMGyyg"
data='{"id":"the-clusternator","pr":"634"}'
url="http://the-clusternator-beta.rangleapp.io/0.0.1/pr/create"

curl -H "Content-Type: application/json"\
     -H "Authorization: Token $token"\
     -X POST -d $data $url
