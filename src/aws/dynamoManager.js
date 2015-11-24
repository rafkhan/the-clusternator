'use strict';

var q = require('q');
var R = require('ramda');

var waitFor = require('../util').waitFor;


var defaultTableParams = {
  AttributeDefinitions: [{
    AttributeName: 'ProjectName',
    AttributeType: 'S'
  }],
  KeySchema: [
    {
      AttributeName: 'ProjectName',
      KeyType: 'HASH'
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 25,
    WriteCapacityUnits: 25
  },
  //TableName: 'TableName'
};


function getDynamoDBManager(ddb) {

  var ddbListTables    = q.nbind(ddb.listTables, ddb);
  var ddbCreateTable   = q.nbind(ddb.createTable, ddb);
  var ddbDescribeTable = q.nbind(ddb.describeTable, ddb);

  function checkTableExistence(tableName) {
    return ddbListTables()
      .then((tables) => {
        // TODO check r.contains
        if(R.contains('tableName', tables.TableNames)) {
          return true;
        } else {
          return false;
        }
      }, (err) => {
        return q.reject(err);
      });
  }

  function createTable(tableName) {
    var tableParams = R.assoc('TableName', tableName, defaultTableParams);
    return ddbCreateTable(tableParams);
  }

  function pollForActiveTable(tableName) {
    return waitFor(() => {
      return ddbDescribeTable(tableName)
        .then((data) => {
          if(data.TableStatus === 'ACTIVE') {
            return q.resolve(data);
          } else {
            return q.reject();
          }
        }, q.reject);
    }, 1000, 100, 'DDB Create Table');
  }

  return {
    checkTableExistence: checkTableExistence,
    createTable: createTable,
    pollForActiveTable: pollForActiveTable
  };
}

module.exports = getDynamoDBManager;
