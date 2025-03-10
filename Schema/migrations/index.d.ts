import { NonNullValue } from '../../QueryDescription'
import type { $RE, $Exact } from '../../types'
import type {
  ColumnName,
  ColumnSchema,
  TableName,
  TableSchema,
  TableSchemaSpec,
  SchemaVersion,
} from '../index'

export type CreateTableMigrationStep = $RE<{
  type: 'create_table'
  schema: TableSchema
}>

export type AddColumnsMigrationStep = $RE<{
  type: 'add_columns'
  table: TableName<any>
  columns: ColumnSchema[]
  unsafeSql?: (_: string) => string
}>

export type DestroyColumnMigrationStep = $RE<{
  type: 'destroy_column'
  table: TableName<any>
  column: ColumnName
  unsafeSql?: (_: string) => string
}>

export type RenameColumnMigrationStep = $RE<{
  type: 'rename_column'
  table: TableName<any>
  from: ColumnName
  to: ColumnName
  unsafeSql?: (_: string) => string
}>

export type DestroyTableMigrationStep = $RE<{
  type: 'destroy_table'
  table: TableName<any>
  unsafeSql?: (_: string) => string
}>

export type MakeColumnOptionalMigrationStep = $RE<{
  type: 'make_column_optional',
  table: TableName<any>,
  column: ColumnName,
  unsafeSql?: (string) => string,
}>

export type MakeColumnRequiredMigrationStep = $RE<{
  type: 'make_column_required',
  table: TableName<any>,
  column: ColumnName,
  defaultValue: NonNullValue,
  unsafeSql?: (string) => string,
}>

export type AddColumnIndexMigrationStep = $RE<{
  type: 'add_column_index',
  table: TableName<any>,
  column: ColumnName,
  unsafeSql?: (string) => string,
}>

export type RemoveColumnIndexMigrationStep = $RE<{
  type: 'remove_column_index',
  table: TableName<any>,
  column: ColumnName,
  unsafeSql?: (string) => string,
}>

export type SqlMigrationStep = $RE<{
  type: 'sql'
  sql: string
}>

export type MigrationStep =
  | CreateTableMigrationStep
  | AddColumnsMigrationStep
  | SqlMigrationStep
  | DestroyColumnMigrationStep
  | RenameColumnMigrationStep
  | MakeColumnOptionalMigrationStep
  | MakeColumnRequiredMigrationStep
  | AddColumnIndexMigrationStep
  | RemoveColumnIndexMigrationStep
  | DestroyTableMigrationStep

type Migration = $RE<{
  toVersion: SchemaVersion
  steps: MigrationStep[]
}>

type SchemaMigrationsSpec = $RE<{
  migrations: Migration[]
}>

export type SchemaMigrations = $RE<{
  validated: true
  minVersion: SchemaVersion
  maxVersion: SchemaVersion
  sortedMigrations: Migration[]
}>

export function schemaMigrations(migrationSpec: SchemaMigrationsSpec): SchemaMigrations

export function createTable(tableSchemaSpec: TableSchemaSpec): CreateTableMigrationStep

export function addColumns({
  table,
  columns,
  unsafeSql,
}: $Exact<{
  table: TableName<any>
  columns: ColumnSchema[]
  unsafeSql?: (_: string) => string
}>): AddColumnsMigrationStep

/** Requires sqlite 3.35.0 (iOS 15 / Android 14) */
export function destroyColumn({
  table,
  column,
  unsafeSql,
}: $Exact<{
  table: TableName<any>
  column: ColumnName
  unsafeSql?: (_: string) => string
}>): DestroyColumnMigrationStep

/** Requires sqlite 3.25.0 (iOS 13 / Android 11) */
export function renameColumn({
  table,
  from,
  to,
  unsafeSql,
}: $Exact<{
  table: TableName<any>
  from: string
  to: string
  unsafeSql?: (_: string) => string
}>): RenameColumnMigrationStep

export function makeColumnOptional({
  table,
  column,
  unsafeSql,
}: $Exact<{
  table: TableName<any>,
  column: ColumnName,
  unsafeSql?: (string) => string,
}>): MakeColumnOptionalMigrationStep

export function makeColumnRequired({
  table,
  column,
  defaultValue,
  unsafeSql,
}: $Exact<{
  table: TableName<any>,
  column: ColumnName,
  defaultValue: any,
  unsafeSql?: (string) => string,
}>): MakeColumnRequiredMigrationStep

export function addColumnIndex({ table, column, unsafeSql}: $Exact<{
  table: TableName<any>,
  column: ColumnName,
  unsafeSql?: (string) => string,
}>): AddColumnIndexMigrationStep

export function removeColumnIndex({ table, column, unsafeSql }: $Exact<{
  table: TableName<any>,
  column: ColumnName,
  unsafeSql?: (string) => string,
}>): RemoveColumnIndexMigrationStep

export function destroyTable({
  table,
  unsafeSql,
}: $Exact<{
  table: TableName<any>
  unsafeSql?: (_: string) => string
}>): DestroyTableMigrationStep

export function unsafeExecuteSql(sql: string): SqlMigrationStep
