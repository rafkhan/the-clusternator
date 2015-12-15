#!/bin/bash

# please only use ephemeral keys here!!
token="root:TdDbb6g0cR4I9jMQOB8kgvyI5SIhj345Xs_U4TaioPSYqrF6WVEXvArprBcXFqX9jJ-ac7UOPVvJZMSD_puHMQ"
data='{"id":"sideboard","pr":"255"}'
version="-alpha"
url="http://the-clusternator$version.rangleapp.io/0.0.1/pr/create"
#url="http://192.168.99.100:9090/0.0.1/pr/create"

curl -H "Content-Type: application/json"\
     -H "Authorization: Token $token"\
     -X POST -d $data $url
