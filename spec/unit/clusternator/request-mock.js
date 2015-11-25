'use strict';

/** note, this is the most minimal stub/mock of request possible */
var result = {}, response = {
  statusCode: 200
};

function request(reqObj, callback) {
  if (result instanceof Error) {
    callback(result);
  } else {
    callback(null, response, result, reqObj);
  }
}

function setResult(val) {
  result = val;
}

function setResponse(val) {
  response = val;
}

request.setResult = setResult;
request.setResponse = setResponse;

module.exports = request;