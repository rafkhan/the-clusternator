#!/bin/bash

# please only use ephemeral keys here!!
token="clusternator-project-the-clusternator:T7JB2zELNmbCc1nTtRhBUQluDsEvwZN7bwLZUGrk7bhYozv5ThJHrZ1oXC0qpuxpjdDGg22rp8-Jl80Dou_KiA"
data='{"id":"sideboard","pr":"255"}'
#data='{"username":"pat","authority":1,"password":"testtesttest"}'
#version="-alpha"
#url="http://the-clusternator$version.rangleapp.io/0.1/pr/create"
#url="http://192.168.99.100:9090/0.1/project/create"
url="http://127.0.0.1:9090/0.1/pr/create"

curl -H "Content-Type: application/json"\
     -H "Authorization: Token $token"\
     -X POST -d $data $url
