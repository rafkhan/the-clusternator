'use strict';

var R = require('ramda');
var koa = require('koa');
var route = require('koa-route');
var bodyParser = require('koa-bodyparser');

var app = koa();


// Every application exists as a "unit"
// Units contain everything needed to track down the git commit that generated
// an image, and the image itself
function getUnitController() {
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
    function hasMatchingRef(a, b) {
      return a.ref === b.ref;
    }

    var refMatchIndex = R.findIndex(hasMatchingRef, unit, unitsDb);

    if(refMatchIndex > -1) {
      unitsDb = R.update(refMatchIndex, unit, unitsDb);
    }
  }

  function* addUnitHandler() {
    var _this = this;
    var reqBody = _this.request.body;

    /*
     * We should expect the request body to look like the following:
     *
     * {
     *   ref: 51 | 'tag-name' | 'branch-name'
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

    this.state.responseData = newUnit;

    addUnit(newUnit);
  }

  return {
    pushUnit: addUnitHandler
  };
}



function* globalErrorHandler(next) {
  try {
    yield next;
    this.body = JSON.stringify(this.state.responseData);
  } catch(e) {
    //TODO handle the error
    console.log('caught', e);
  }
}

app.use(globalErrorHandler);

app.use(bodyParser());

var unitController = getUnitController();
app.use(route.get('/', unitController.pushUnit));

app.listen(3000);
