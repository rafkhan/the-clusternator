'use strict';

var express = require('express');

var app = express();

app.get('/ping', function (req, res) {
  res.send('Still alive.');
});

app.post('/clusternate', function (req, res) {});

app.listen(8080);