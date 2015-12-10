#!/bin/bash

# please only use ephemeral keys here!!
token="root:vshjYez6oCza8eV7fdeAPY6QE0IREk7HUKvA0S7dr6CzvZgbcVHt4ManAoF7omsV4_hoyQgClzILrYKHl92p-A"
data='{"id":"the-clusternator","pr":"638"}'
url="http://the-clusternator-beta.rangleapp.io/0.0.1/pr/destroy"

curl -H "Content-Type: application/json"\
     -H "Authorization: Token $token"\
     -X POST -d $data $url
