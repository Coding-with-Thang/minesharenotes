#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/141daf1868e482ff94c77ebffaafa19eb950fecb7b0f5ceca7880c321866078c/contract';
import startContract from '../../snapshots/141daf1868e482ff94c77ebffaafa19eb950fecb7b0f5ceca7880c321866078c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/45c20038df3510901a717db0320fb177938405d68f788e05ad823fe88a52ab58/contract';
import endContract from '../../snapshots/45c20038df3510901a717db0320fb177938405d68f788e05ad823fe88a52ab58/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'NoteImage',
        columns: [
          col('contentType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('data', 'bytea', { notNull: true, codecRef: { codecId: 'pg/bytea@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('noteId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'NoteImage',
        index: 'NoteImage_noteId_idx_0612c5b1',
        columns: ['noteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'NoteImage',
        index: 'NoteImage_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'NoteImage',
        foreignKey: {
          name: 'NoteImage_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'NoteImage',
        foreignKey: {
          name: 'NoteImage_noteId_fkey',
          columns: ['noteId'],
          references: { schema: 'public', table: 'Note', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
