#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/141daf1868e482ff94c77ebffaafa19eb950fecb7b0f5ceca7880c321866078c/contract';
import endContract from '../../snapshots/141daf1868e482ff94c77ebffaafa19eb950fecb7b0f5ceca7880c321866078c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/33579862e7459acbe4737b53460490b4291061ff5720ad0cace02fa74df90c9d/contract';
import startContract from '../../snapshots/33579862e7459acbe4737b53460490b4291061ff5720ad0cace02fa74df90c9d/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Category',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Note',
        column: col('categoryId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Task',
        column: col('tags', 'text[]', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'Category',
        constraint: 'Category_userId_name_key',
        columns: ['userId', 'name'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Task',
        constraint: 'Task_tags_elem_not_null_aecbe9e2',
        expression: sql`array_position("tags", NULL) IS NULL`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'Category',
        index: 'Category_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Note',
        index: 'Note_categoryId_idx_15c304f2',
        columns: ['categoryId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Category',
        foreignKey: {
          name: 'Category_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Note',
        foreignKey: {
          name: 'Note_categoryId_fkey',
          columns: ['categoryId'],
          references: { schema: 'public', table: 'Category', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
