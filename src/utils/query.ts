import { GetQueryOptions, GetQueryResults, MappedRecord } from '../types';
import { escapeIdentifier, escapeLiteral } from './escape';

export function getQuery<TSchema extends { [K: keyof any]: any }>(
  records: MappedRecord<TSchema>[],
  schema: TSchema,
  options: GetQueryOptions = {}
): GetQueryResults {
  const json = escapeLiteral(
    typeof options.data === 'string' ? options.data : JSON.stringify(records)
  );
  const selects = Array.isArray(options.selects) ? options.selects : ['*'];
  const columns = Object.keys(schema).map(column => {
    const value = schema[column];
    const type =
      typeof value === 'object' &&
      value !== null &&
      typeof value.type === 'string'
        ? value.type
        : 'TEXT';
    return escapeIdentifier(column.toString()) + ' ' + type;
  });

  const alias = escapeIdentifier(options.alias || 'tbl');
  const fn = `${options.jsonb ? 'jsonb' : 'json'}_to_recordset` as const;
  const raw = [
    `SELECT ${selects.join(', ')}`,
    `FROM ${fn}(${json})`,
    `AS ${alias}(${columns.join(', ')})`
  ].join('\n');

  return { raw, json, columns };
}
