#!/bin/bash

# please only use ephemeral keys here!!
token="root:fozmm2fRkpbtPNF8j4jXEjJR-zMdOgilPr4i3cNO0wep-x-qApw4SLGX-a9RKtR-4drpN79YjHMVVEPcXe9i0g"
#data='{"id":"sideboard","pr":"255"}'
data='{"projectId":"ctest"}'
version="-alpha"
#url="http://the-clusternator$version.rangleapp.io/0.1/pr/create"
#url="http://192.168.99.100:9090/0.1/project/create"
url="http://127.0.0.1:9090/0.1/project/create/"

curl -H "Content-Type: application/json"\
     -H "Authorization: Token $token"\
     -X POST -d $data $url
