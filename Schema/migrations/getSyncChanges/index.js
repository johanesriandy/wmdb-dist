"use strict";

exports.__esModule = true;
exports.default = getSyncChanges;
var _index = require("../../index");
var _stepsForMigration = require("../stepsForMigration");
var _common = require("../../../utils/common");
function getSyncChanges(migrations, fromVersion, toVersion) {
  var steps = (0, _stepsForMigration.stepsForMigration)({
    migrations: migrations,
    fromVersion: fromVersion,
    toVersion: toVersion
  });
  (0, _common.invariant)(steps, 'Necessary range of migrations for sync is not available');
  (0, _common.invariant)(toVersion === migrations.maxVersion, 'getSyncChanges toVersion should be equal to maxVersion of migrations');
  if (fromVersion === toVersion) {
    return null;
  }
  var createdTables = new Set();
  var createdColumns = new Map();
  steps.forEach(function (step) {
    (0, _common.invariant)(['create_table', 'add_columns', 'destroy_column', 'rename_column', 'destroy_table', "add_column_index", "remove_column_index", "make_column_optional", "make_column_required", 'sql'].includes(step.type), "Unknown migration step type ".concat(step.type, ". Can not perform migration sync. This most likely means your migrations are defined incorrectly. It could also be a WatermelonDB bug."));
    if ('create_table' === step.type) {
      createdTables.add(step.schema.name);
    } else if ('add_columns' === step.type) {
      if (createdTables.has(step.table)) {
        return;
      }
      var columns = createdColumns.get(step.table) || new Set();
      step.columns.forEach(function (column) {
        columns.add(column.name);
      });
      createdColumns.set(step.table, columns);
    } else if ('destroy_table' === step.type) {
      createdTables.delete(step.table);
      createdColumns.delete(step.table);
    } else if ('destroy_column' === step.type) {
      var _columns = createdColumns.get(step.table);
      if (_columns) {
        _columns.delete(step.column);
      }
    } else if ('rename_column' === step.type) {
      var _columns2 = createdColumns.get(step.table);
      if (_columns2 && _columns2.has(step.from)) {
        _columns2.delete(step.from);
        _columns2.add(step.to);
      }
    }
  });
  var columnsByTable = Array.from(createdColumns.entries()).map(function ([table, columns]) {
    return {
      table: (0, _index.tableName)(table),
      columns: Array.from(columns)
    };
  });
  return {
    from: fromVersion,
    tables: Array.from(createdTables),
    columns: columnsByTable
  };
}