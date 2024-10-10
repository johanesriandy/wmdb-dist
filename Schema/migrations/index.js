"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.addColumnIndex = addColumnIndex;
exports.addColumns = addColumns;
exports.createTable = createTable;
exports.destroyColumn = destroyColumn;
exports.destroyTable = destroyTable;
exports.makeColumnOptional = makeColumnOptional;
exports.makeColumnRequired = makeColumnRequired;
exports.removeColumnIndex = removeColumnIndex;
exports.renameColumn = renameColumn;
exports.schemaMigrations = schemaMigrations;
exports.unsafeExecuteSql = unsafeExecuteSql;
var _sortBy = _interopRequireDefault(require("../../utils/fp/sortBy"));
var _invariant = _interopRequireDefault(require("../../utils/common/invariant"));
var _isObj = _interopRequireDefault(require("../../utils/fp/isObj"));
var _index = require("../index");
// NOTE: Only require files needed (critical path on web)
// Creates a specification of how to migrate between different versions of
// database schema. Every time you change the database schema, you must
// create a corresponding migration.
//
// See docs for more details
//
// Example:
//
// schemaMigrations({
//   migrations: [
//     {
//       toVersion: 3,
//       steps: [
//         createTable({
//           name: 'comments',
//           columns: [
//             { name: 'post_id', type: 'string', isIndexed: true },
//             { name: 'body', type: 'string' },
//           ],
//         }),
//         addColumns({
//           table: 'posts',
//           columns: [
//             { name: 'subtitle', type: 'string', isOptional: true },
//             { name: 'is_pinned', type: 'boolean' },
//           ],
//         }),
//       ],
//     },
//     {
//       toVersion: 2,
//       steps: [
//         // ...
//       ],
//     },
//   ],
// })
function schemaMigrations(migrationSpec) {
  var {
    migrations: migrations
  } = migrationSpec;
  if ('production' !== process.env.NODE_ENV) {
    // validate migrations spec object
    (0, _invariant.default)(Array.isArray(migrations), 'Missing migrations array');

    // validate migrations format
    migrations.forEach(function (migration) {
      (0, _invariant.default)((0, _isObj.default)(migration), "Invalid migration (not an object) in schema migrations");
      var {
        toVersion: toVersion,
        steps: steps
      } = migration;
      (0, _invariant.default)('number' === typeof toVersion, 'Invalid migration - `toVersion` must be a number');
      (0, _invariant.default)(2 <= toVersion, "Invalid migration to version ".concat(toVersion, ". Minimum possible migration version is 2"));
      (0, _invariant.default)(Array.isArray(steps) && steps.every(function (step) {
        return 'string' === typeof step.type;
      }), "Invalid migration steps for migration to version ".concat(toVersion, ". 'steps' should be an array of migration step calls"));
    });
  }

  // TODO: Force order of migrations?
  var sortedMigrations = (0, _sortBy.default)(function (migration) {
    return migration.toVersion;
  }, migrations);
  var oldestMigration = sortedMigrations[0];
  var newestMigration = sortedMigrations[sortedMigrations.length - 1];
  var minVersion = oldestMigration ? oldestMigration.toVersion - 1 : 1;
  var maxVersion = (null === newestMigration || void 0 === newestMigration ? void 0 : newestMigration.toVersion) || 1;
  if ('production' !== process.env.NODE_ENV) {
    // validate that migration spec is without gaps and duplicates
    sortedMigrations.reduce(function (maxCoveredVersion, migration) {
      var {
        toVersion: toVersion
      } = migration;
      if (maxCoveredVersion) {
        (0, _invariant.default)(toVersion === maxCoveredVersion + 1, "Invalid migrations! Migrations listed cover range from version ".concat(minVersion, " to ").concat(maxCoveredVersion, ", but migration ").concat(JSON.stringify(migration), " is to version ").concat(toVersion, ". Migrations must be listed without gaps, or duplicates."));
      }
      return toVersion;
    }, null);
  }
  return {
    sortedMigrations: sortedMigrations,
    minVersion: minVersion,
    maxVersion: maxVersion,
    validated: true
  };
}
function createTable(tableSchemaSpec) {
  var schema = (0, _index.tableSchema)(tableSchemaSpec);
  return {
    type: 'create_table',
    schema: schema
  };
}
function addColumns({
  table: table,
  columns: columns,
  unsafeSql: unsafeSql
}) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(table, "Missing table name in addColumn()");
    (0, _invariant.default)(columns && Array.isArray(columns), "Missing 'columns' or not an array in addColumn()");
    columns.forEach(function (column) {
      return (0, _index.validateColumnSchema)(column);
    });
  }
  return {
    type: 'add_columns',
    table: table,
    columns: columns,
    unsafeSql: unsafeSql
  };
}

/** Requires sqlite 3.35.0 (iOS 15 / Android 14) */
function destroyColumn({
  table: table,
  column: column,
  unsafeSql: unsafeSql
}) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(table, "Missing 'table' in destroyColumn()");
    (0, _invariant.default)(column, "Missing 'column' in destroyColumn()");
  }
  return {
    type: 'destroy_column',
    table: table,
    column: column,
    unsafeSql: unsafeSql
  };
}
function unsafeExecuteSql(sql) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)('string' === typeof sql, "SQL passed to unsafeExecuteSql is not a string");
    (0, _invariant.default)(sql.trimEnd().endsWith(';'), "SQL passed to unsafeExecuteSql must end with a semicolon (it would work when executed individually but break if multiple migration steps are executed)");
  }
  return {
    type: 'sql',
    sql: sql
  };
}
function renameColumn({
  table: table,
  from: from,
  to: to,
  unsafeSql: unsafeSql
}) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(table, "Missing table name in renameColumn()");
    (0, _invariant.default)(from, "Missing 'from' in renameColumn()");
    (0, _invariant.default)(to, "Missing 'to' in renameColumn()");
    (0, _index.validateName)(to);
  }
  return {
    type: 'rename_column',
    table: table,
    from: from,
    to: to,
    unsafeSql: unsafeSql
  };
}
function makeColumnOptional({
  table: table,
  column: column,
  unsafeSql: unsafeSql
}) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(table, "Missing table name in makeColumnOptional()");
    (0, _invariant.default)(column, "Missing 'column' in makeColumnOptional()");
  }
  return {
    type: 'make_column_optional',
    table: table,
    column: column,
    unsafeSql: unsafeSql
  };
}
function makeColumnRequired({
  table: table,
  column: column,
  defaultValue: defaultValue,
  unsafeSql: unsafeSql
}) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(table, "Missing table name in makeColumnRequired()");
    (0, _invariant.default)(column, "Missing 'column' in makeColumnRequired()");
    (0, _invariant.default)(defaultValue, "Missing 'defaultValue' in makeColumnRequired()");
  }
  return {
    type: 'make_column_required',
    table: table,
    column: column,
    defaultValue: defaultValue,
    unsafeSql: unsafeSql
  };
}
function addColumnIndex({
  table: table,
  column: column,
  unsafeSql: unsafeSql
}) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(table, "Missing table name in addColumnIndex()");
    (0, _invariant.default)(column, "Missing 'column' in addColumnIndex()");
  }
  return {
    type: 'add_column_index',
    table: table,
    column: column,
    unsafeSql: unsafeSql
  };
}
function removeColumnIndex({
  table: table,
  column: column,
  unsafeSql: unsafeSql
}) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(table, "Missing table name in removeColumnIndex()");
    (0, _invariant.default)(column, "Missing 'column' in removeColumnIndex()");
  }
  return {
    type: 'remove_column_index',
    table: table,
    column: column,
    unsafeSql: unsafeSql
  };
}
function destroyTable({
  table: table,
  unsafeSql: unsafeSql
}) {
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(table, "Missing 'table' in destroyTable()");
  }
  return {
    type: 'destroy_table',
    table: table,
    unsafeSql: unsafeSql
  };
}

/*

TODO: Those types of migrations are currently not implemented. If you need them, feel free to contribute!

// table operations
renameTable({ from: 'old_table_name', to: 'new_table_name' })

// indexing
addColumnIndex({ table: 'table_name', column: 'column_name' })
removeColumnIndex({ table: 'table_name', column: 'column_name' })

// optionality
makeColumnOptional({ table: 'table_name', column: 'column_name' }) // allows nulls now
makeColumnRequired({ table: 'table_name', column: 'column_name' }) // nulls are changed to null value ('', 0, false)

*/