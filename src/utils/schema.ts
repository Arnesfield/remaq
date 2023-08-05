export function getSchema<TData extends { [K: keyof any]: any }>(
  data: TData | TData[]
): { [K in keyof TData]: any } {
  // NOTE: taken from https://stackoverflow.com/a/57109487/7013346
  const schema: { [K in keyof TData]: any } = Array.isArray(data)
    ? Object.assign({}, ...data)
    : { ...data };
  for (const key in schema) {
    schema[key] = key;
  }
  return schema;
}
