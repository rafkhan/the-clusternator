'use strict';

var Q = require('q');
var R = require('ramda');


var defaultTableParams = {
  
};


function getDynamoDBManager(ddb) {

  var ddbListTables  = Q.nbind(ddb.listTables, ddb);
  var ddbCreateTable = Q.nbind(ddb.createTable, ddb);

  function checkTableExistence(tableName) {
    return ddbListTables()
      .then((tables) => {
        console.log(tables);
      }, (err) => {
        return q.reject(err);
      });
  }

  function createTable(tableName) {
    
  }

  return {
    checkTableExistence: checkTableExistence
  };
}

module.exports = getDynamoDBManager;
