import { EachRecordCallback, MappedRecord, Remaq, Schema } from '../types';
import { getQuery } from '../utils/query';
import { getRecords } from '../utils/records';
import { getSchema } from '../utils/schema';

/**
 * Prepare {@linkcode data} to remap.
 * @template TData The type of {@linkcode data}.
 * @param data The data to remap.
 * @returns The {@linkcode Remaq} object.
 */
export function remaq<TData extends { [K: keyof any]: any }>(
  data: TData | TData[]
): Remaq<TData, { [K in keyof TData]: any }> {
  return remap(data);
}

function remap<
  TData extends { [K: keyof any]: any },
  TSchema extends Schema<TData>
>(
  data: TData | TData[],
  schema?: TSchema,
  each?: EachRecordCallback<TData, TSchema>
): Remaq<TData, TSchema> {
  let records: MappedRecord<TSchema>[] | null | undefined;
  const self: Remaq<TData, TSchema> = {
    get schema() {
      return (schema ||= getSchema(data));
    },
    records() {
      if (records === null) {
        throw new Error('Cannot get `records` while it is being evaluated.');
      }
      // set to null first to avoid infinite recursion with `each` callback
      records = null;
      return (records = getRecords(data, self.schema, each));
    },
    each(callback) {
      each = callback;
      records = undefined;
      return self;
    },
    using<USchema extends Schema<TData>>(schema: USchema) {
      return remap(data, schema);
    },
    getQuery(options) {
      return getQuery(self.records(), self.schema, options);
    }
  };
  return self;
}
