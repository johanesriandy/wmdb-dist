"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.encodeCreateIndices = encodeCreateIndices;
exports.encodeDropIndices = encodeDropIndices;
exports.encodeSchema = exports.encodeMigrationSteps = void 0;
var _RawRecord = require("../../../RawRecord");
var _encodeValue = _interopRequireDefault(require("../encodeValue"));
var standardColumnsInsertSQL = "\"id\" primary key, \"_changed\", \"_status\"";
var commonSchema = 'create table "local_storage" ("key" varchar(16) primary key not null, "value" text not null);' + 'create index "local_storage_key_index" on "local_storage" ("key");';
var encodeCreateTable = function ({
  name: name,
  columns: columns
}) {
  var columnsSQL = [standardColumnsInsertSQL].concat(Object.keys(columns).map(function (column) {
    return "\"".concat(column, "\"");
  })).join(', ');
  return "create table \"".concat(name, "\" (").concat(columnsSQL, ");");
};
var encodeIndex = function (column, tableName) {
  return column.isIndexed ? "create index if not exists \"".concat(tableName, "_").concat(column.name, "\" on \"").concat(tableName, "\" (\"").concat(column.name, "\");") : '';
};
var encodeTableIndicies = function ({
  name: tableName,
  columns: columns
}) {
  return Object.values(columns)
  // $FlowFixMe
  .map(function (column) {
    return encodeIndex(column, tableName);
  }).concat(["create index if not exists \"".concat(tableName, "__status\" on \"").concat(tableName, "\" (\"_status\");")]).join('');
};
var identity = function (sql) {
  return sql;
};
var encodeTable = function (table) {
  return (table.unsafeSql || identity)(encodeCreateTable(table) + encodeTableIndicies(table));
};
var encodeSchema = exports.encodeSchema = function ({
  tables: tables,
  unsafeSql: unsafeSql
}) {
  var sql = Object.values(tables)
  // $FlowFixMe
  .map(encodeTable).join('');
  return (unsafeSql || identity)(commonSchema + sql, 'setup');
};
function encodeCreateIndices({
  tables: tables,
  unsafeSql: unsafeSql
}) {
  var sql = Object.values(tables)
  // $FlowFixMe
  .map(encodeTableIndicies).join('');
  return (unsafeSql || identity)(sql, 'create_indices');
}
function encodeDropIndices({
  tables: tables,
  unsafeSql: unsafeSql
}) {
  var sql = Object.values(tables)
  // $FlowFixMe
  .map(function ({
    name: tableName,
    columns: columns
  }) {
    return Object.values(columns)
    // $FlowFixMe
    .map(function (column) {
      return column.isIndexed ? "drop index if exists \"".concat(tableName, "_").concat(column.name, "\";") : '';
    }).concat(["drop index if exists \"".concat(tableName, "__status\";")]).join('');
  }).join('');
  return (unsafeSql || identity)(sql, 'drop_indices');
}
var encodeAddColumnsMigrationStep = function ({
  table: table,
  columns: columns,
  unsafeSql: unsafeSql
}) {
  return columns.map(function (column) {
    var addColumn = "alter table \"".concat(table, "\" add \"").concat(column.name, "\";");
    var setDefaultValue = "update \"".concat(table, "\" set \"").concat(column.name, "\" = ").concat((0, _encodeValue.default)((0, _RawRecord.nullValue)(column)), ";");
    var addIndex = encodeIndex(column, table);
    return (unsafeSql || identity)(addColumn + setDefaultValue + addIndex);
  }).join('');
};
var encodeDestroyColumnMigrationStep = function ({
  table: table,
  column: column,
  unsafeSql: unsafeSql
}) {
  // We don't know if column is indexed, but if it is, we need to drop it
  return (unsafeSql || identity)("drop index if exists \"".concat(table, "_").concat(column, "\";alter table \"").concat(table, "\" drop column \"").concat(column, "\";"));
};
var encodeRenameColumnMigrationStep = function ({
  table: table,
  from: from,
  to: to,
  unsafeSql: unsafeSql
}) {
  return (unsafeSql || identity)("alter table \"".concat(table, "\" rename column \"").concat(from, "\" to \"").concat(to, "\";"));
};
var encodeMakeColumnOptionalMigrationStep = function ({
  unsafeSql: unsafeSql
}) {
  // The column created in schema is not adding the column constraint for `NOT NULL`
  // there no further action to perform to add NULLABILITY for column that required before.
  return (unsafeSql || identity)("");
};
var encodeMakeColumnRequiredMigrationStep = function ({
  table: table,
  column: column,
  defaultValue: defaultValue,
  unsafeSql: unsafeSql
}) {
  return (unsafeSql || identity)("update table \"".concat(table, "\" set ").concat(column, " = ").concat((0, _encodeValue.default)(defaultValue), " where ").concat(column, " = NULL"));
};
var encodeDestroyTableMigrationStep = function ({
  table: table,
  unsafeSql: unsafeSql
}) {
  return (unsafeSql || identity)("drop table if exists \"".concat(table, "\";"));
};
var encodeMigrationSteps = exports.encodeMigrationSteps = function (steps) {
  return steps.map(function (step) {
    if ('create_table' === step.type) {
      return encodeTable(step.schema);
    } else if ('add_columns' === step.type) {
      return encodeAddColumnsMigrationStep(step);
    } else if ('destroy_column' === step.type) {
      return encodeDestroyColumnMigrationStep(step);
    } else if ('rename_column' === step.type) {
      return encodeRenameColumnMigrationStep(step);
    } else if ('make_column_optional' === step.type) {
      return encodeMakeColumnOptionalMigrationStep(step);
    } else if ('make_column_required' === step.type) {
      return encodeMakeColumnRequiredMigrationStep(step);
    } else if ('add_column_index' === step.type) {
      return encodeMakeColumnRequiredMigrationStep(step);
    } else if ('remove_column_index' === step.type) {
      return encodeMakeColumnRequiredMigrationStep(step);
    } else if ('destroy_table' === step.type) {
      return encodeDestroyTableMigrationStep(step);
    } else if ('sql' === step.type) {
      return step.sql;
    }
    throw new Error("Unsupported migration step ".concat(step.type));
  }).join('');
};