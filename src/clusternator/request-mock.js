'use strict';

/** note, this is the most minimal stub/mock of request possible */
var result = JSON.stringify({ payload: null }), response = {
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
  if ((typeof val === 'string') || (val instanceof Error)) {
    result = val;
  } else {
    result = JSON.stringify(val);
  }
}

function setResponse(val) {
  response = val;
}

request.setResult = setResult;
request.setResponse = setResponse;

module.exports = request;