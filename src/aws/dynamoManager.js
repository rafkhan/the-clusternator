'use strict';

var q = require('q');
var R = require('ramda');

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
  var ddbPutItem       = q.nbind(ddb.putItem, ddb);

  function checkTableExistence(tableName) {
    return ddbListTables()
      .then((tables) => {
        // TODO check r.contains
        if(R.contains(tableName, tables.TableNames)) {
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

  function checkActiveTable(tableName) {
    return ddbDescribeTable({ TableName: tableName })
      .then((data) => {
        var tableStatus = data.Table.TableStatus;
        if(tableStatus === 'ACTIVE') {
          return q.resolve(data);
        } else {
          return q.reject();
        }
      }, (err) => {
        return err;
      });
  }

  return {
    checkTableExistence: checkTableExistence,
    createTable: createTable,
    checkActiveTable: checkActiveTable 
  };
}

module.exports = getDynamoDBManager;
