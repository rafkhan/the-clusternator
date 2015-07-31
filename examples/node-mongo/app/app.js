var winston = require('winston');
var express = require('express');
var MongoClient = require('mongodb').MongoClient;

var app = express();

var collection;

function errCheck(e) {
  if(e) {
    winston.error(e);
    throw e;
  }
}

winston.add(winston.transports.File, { filename: '/nodelogs/logs.log' });
//winston.remove(winston.transports.Console);

var MONGO_IP = process.env.MONGOSERVER_PORT_27017_TCP_ADDR;

MongoClient.connect('mongodb://' + MONGO_IP + ':27017/test', function(err, db) {
  errCheck(err);

  if(!db) {
    return;
  }
    
  collection = db.collection('test_insert');
  collection.insert({ theBest: 'Raf', count: 0 }, function(err, docs) {
    if(err) {
      winston.error(err);
      throw err;
    }
    winston.info('Inserted', docs);
  });
    
});

app.get('/', function (req, res) {
  if(collection) {
    collection.updateOne({ theBest: 'Raf'}, { $inc : { count: 1 } }, function(err, results) {
      errCheck(err);

      collection.find().toArray(function(err, results) {
        errCheck(err);
        res.json(results);
        return;
      });
    });
  } else {
    res.send('No mongo connection :(');
    return;
  }
});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
