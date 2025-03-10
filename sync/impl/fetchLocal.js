"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = fetchLocalChanges;
exports.hasUnsyncedChanges = hasUnsyncedChanges;
var _fp = require("../../utils/fp");
var _allPromisesObj = _interopRequireDefault(require("../../utils/fp/allPromisesObj"));
var Q = _interopRequireWildcard(require("../../QueryDescription"));
var _Schema = require("../../Schema");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// NOTE: Two separate queries are faster than notEq(synced) on LokiJS
var createdQuery = Q.where((0, _Schema.columnName)('_status'), 'created');
var updatedQuery = Q.where((0, _Schema.columnName)('_status'), 'updated');
function fetchLocalChangesForCollection(collection) {
  return new Promise(function ($return, $error) {
    var createdRecords, updatedRecords, deletedRecords, changeSet, changedRecords;
    return Promise.resolve(Promise.all([collection.query(createdQuery).fetch(), collection.query(updatedQuery).fetch(), collection.database.adapter.getDeletedRecords(collection.table)])).then(function ($await_1) {
      try {
        [createdRecords, updatedRecords, deletedRecords] = $await_1;
        changeSet = {
          created: [],
          updated: [],
          deleted: deletedRecords
        };
        // TODO: It would be best to omit _status, _changed fields, since they're not necessary for the server
        // but this complicates markLocalChangesAsDone, since we don't have the exact copy to compare if record changed
        // TODO: It would probably also be good to only send to server locally changed fields, not full records
        // perf-critical - using mutation
        createdRecords.forEach(function (record) {
          // $FlowFixMe
          changeSet.created.push(Object.assign({}, record._raw));
        });
        updatedRecords.forEach(function (record) {
          // $FlowFixMe
          changeSet.updated.push(Object.assign({}, record._raw));
        });
        changedRecords = createdRecords.concat(updatedRecords);
        return $return([changeSet, changedRecords]);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}
function fetchLocalChanges(db) {
  return db.read(function () {
    return new Promise(function ($return, $error) {
      var changes;
      return Promise.resolve((0, _allPromisesObj.default)((0, _fp.mapObj)(fetchLocalChangesForCollection, db.collections.map))).then(function ($await_2) {
        try {
          changes = $await_2;
          // TODO: deep-freeze changes object (in dev mode only) to detect mutations (user bug)
          return $return({
            // $FlowFixMe
            changes: (0, _fp.mapObj)(function ([changeSet]) {
              return changeSet;
            })(changes),
            affectedRecords: (0, _fp.unnest)((0, _fp.values)(changes).map(function ([, records]) {
              return records;
            }))
          });
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    });
  }, 'sync-fetchLocalChanges');
}
function hasUnsyncedChanges(db) {
  // action is necessary to ensure other code doesn't make changes under our nose
  return db.read(function () {
    return new Promise(function ($return, $error) {
      var collections, hasUnsynced, unsyncedFlags;
      collections = (0, _fp.values)(db.collections.map);
      hasUnsynced = function (collection) {
        return new Promise(function ($return, $error) {
          var created, updated, deleted;
          return Promise.resolve(collection.query(createdQuery).fetchCount()).then(function ($await_3) {
            try {
              created = $await_3;
              return Promise.resolve(collection.query(updatedQuery).fetchCount()).then(function ($await_4) {
                try {
                  updated = $await_4;
                  return Promise.resolve(db.adapter.getDeletedRecords(collection.table)).then(function ($await_5) {
                    try {
                      deleted = $await_5;
                      return $return(0 < created + updated + deleted.length);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }, $error);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }, $error);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        });
      };
      return Promise.resolve((0, _fp.allPromises)(hasUnsynced, collections)).then(function ($await_6) {
        try {
          unsyncedFlags = $await_6;
          return $return(unsyncedFlags.some(_fp.identity));
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    });
  }, 'sync-hasUnsyncedChanges');
}