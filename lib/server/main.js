'use strict';

var q = require('Q');
var R = require('ramda');
var log = require('winston');
var koa = require('koa');
var route = require('koa-route');
var bodyParser = require('koa-bodyparser');
var MongoClient = require('mongodb').MongoClient;
var wrap = require('mongodb-next').collection;


var DATABASE = 'clusternator';
var MONGO_URL = 'mongodb://localhost:27017/' + DATABASE;


function getUnitDB(url) {
  var d = q.defer();

  MongoClient.connect(url, function(err, db) {
    if(err) {
      d.reject(err);
    } else {
      d.resolve(db);
    }
  });

  return d.promise;
}


// Every application exists as a "unit"
// Units contain everything needed to track down the git commit that generated
// an image, and the image itself
function getUnitController(db) {

  var unitColl = wrap(db.collection('units'));


  var UNIT_TYPE_PR = 'PR';
  //var UNIT_TYPE_SHA = 'SHA';
  //var UNIT_TYPE_TAG = 'TAG';
  //var UNIT_TYPE_BRANCH = 'BRANCH';

  var unitsDb = [
    {
      ref: '51',
      type: UNIT_TYPE_PR,
      sha: 'xyz',
      imageUrl: 'abc',
      imageTag: 'def',
      start: new Date()
    }
  ];

  function addUnit(unit) {

    /*
    function hasMatchingRef(a, b) {
      return a.ref === b.ref;
    }

    var refMatchIndex = R.findIndex(hasMatchingRef, unit, unitsDb);

    if(refMatchIndex > -1) {
      unitsDb = R.update(refMatchIndex, unit, unitsDb);
    }
    */
  }

  function* addUnitHandler() {
    var _this = this;
    var reqBody = _this.request.body;

    /*
     * We should expect the request body to look like the following:
     *
     * {
     *   ref: 51 | 'tag-name' | 'branch-name',
     *   srcBranch: 'branch-name',
     *   type: 'PR' | 'SHA' | 'TAG' | 'BRANCH', // What does the ref mean?
     *   sha: '03d5895ec17f0f0bc38c1e76ee49ab7e6b0937e1f2193e6ac8f016e73f7e1cf5' // it says 'rangle.io'
     *   imageUrl: '<dockerhub-url>',
     *   imageTag: 'pr51', // This is the unique identifier for your image (TODO standardize this)
     * }
     */

    if(!reqBody.ref  ||
       !reqBody.type ||
       !reqBody.sha  ||
       !reqBody.imageUrl ||
       !reqBody.imageTag) {

      // TODO standard error messages
      throw 'Missing unit arguments';
    }

    var newUnit = R.clone(reqBody);
    newUnit.startTime = new Date();

    //this.state.responseData = newUnit;

    addUnit(newUnit);
  }

  return {
    pushUnit: addUnitHandler
  };
}

function createApp(unitController) {
  var app = koa();
  app.use(bodyParser());

  app.on('error', function(err){
    log.error('server error', err);
  });

  app.use(route.get('/', unitController.pushUnit));

  return app;
}

function getServer() {
  return getUnitDB(MONGO_URL)
           .then(getUnitController, q.reject)
           .then(createApp, q.reject);
}

function startServer(config) {
  getServer(config).then(function(app) {
    app.listen(3000);
  }).then(null, function(err) {
    log.error('Error starting server');
    log.error(err);
  });
}

module.exports = {
  startServer: startServer,
  getServer: getServer
};
