#!/bin/bash

token="root:KlA36YcnEXTytNWAhYk5_vKJSYBomtyllmBXK0XwhPJ_-vZukt4azXX2RGMkFzedb5BLHjteXyglvIW8OOgvkg"
data='{"id":"the-clusternator","pr":"630"}'
url="http://localhost:9090/0.0.1/pr/create"

curl -H "Content-Type: application/json"\
     -H "Authorization: Token $token"\
     -X POST -d $data $url
