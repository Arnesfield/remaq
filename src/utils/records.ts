import { EachRecordCallback, MappedRecord, Schema } from '../types';

function mapValue(remap: { [K: keyof any]: any }, value: keyof any) {
  // allow nulls for remapping and mapped result
  const mapped = remap[value];
  return typeof mapped !== 'undefined' ? mapped : value;
}

export function getRecords<
  TData extends { [K: keyof any]: any },
  TSchema extends Schema<TData>
>(
  data: TData | TData[],
  schema: TSchema,
  each?: EachRecordCallback<TData, TSchema>
): MappedRecord<TSchema>[] {
  const items = Array.isArray(data) ? data : [data];
  const records: MappedRecord<TSchema>[] = [];
  items.forEach((item, index, array) => {
    // build the record, default value to null
    const record = {} as MappedRecord<TSchema>;
    for (const columnName in schema) {
      const options = schema[columnName];
      let result =
        typeof options === 'string'
          ? item[options]
          : typeof options === 'object' &&
            options !== null &&
            typeof options.from !== 'undefined'
          ? item[options.from]
          : null;
      // remap the result
      if (typeof options === 'object' && options.remap) {
        const { remap } = options;
        result = Array.isArray(result)
          ? result.map((item: keyof any) => mapValue(remap, item))
          : mapValue(remap, result as keyof any);
      }
      record[columnName] = result;
    }
    // handle callback
    if (
      typeof each !== 'function' ||
      each(record, item, index, array) !== false
    ) {
      records.push(record);
    }
  });
  return records;
}
