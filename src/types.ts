/**
 * The schema options.
 * @template TFrom The property of data.
 */
export interface SchemaOptions<TFrom extends keyof any> {
  /**
   * The property of data to map from.
   *
   * Value in {@linkcode MappedRecord} defaults to `null` if not provided.
   */
  from?: TFrom;
  /**
   * The data type.
   * @default 'TEXT'
   */
  type?: string;
  /**
   * Transforms data using the following map.
   *
   * If the data is an array, each item is remapped using this object.
   *
   * If the remapping required is complex, prefer to remap the data manually using {@linkcode Remaq.each}.
   */
  remap?: { [K: keyof any]: any };
  /**
   * Validate the {@linkcode value} and throw an error if it is invalid.
   *
   * Validation only occurs after the {@linkcode value} has beem {@linkcode remap}ped.
   * @param value The value to validate.
   * @returns Determines if the {@linkcode value} is valid or not.
   */
  validate?(value: any): boolean;
}

/**
 * The schema type. Map column names to the properties of {@linkcode TData data}.
 *
 * Set column name to `true` to not map to any {@linkcode TData data} properties
 * but retain the property in {@linkcode MappedRecord} (defaults to `null`).
 * @template TData The type of data.
 */
export interface Schema<TData extends { [K: keyof any]: any }> {
  [name: string]: keyof TData | SchemaOptions<keyof TData> | true;
}

/**
 * The mapped record.
 * @template TSchema The schema type.
 */
export type MappedRecord<TSchema extends { [K: keyof any]: any }> = {
  [Key in keyof TSchema]: any;
};

/**
 * Called once per each {@linkcode MappedRecord record} created.
 * @template TData The type of data.
 * @template TSchema The schema type.
 * @param record The {@linkcode MappedRecord record} created.
 * @param value The {@linkcode TData data} to remap.
 * @param index The index of {@linkcode TData data}.
 * @param data All {@linkcode TData data} to remap.
 * @returns Return `false` to exclude the {@linkcode MappedRecord record} from {@linkcode Remaq.records records()}.
 */
export type EachRecordCallback<
  TData extends { [K: keyof any]: any },
  TSchema extends Schema<TData>
> = (
  record: MappedRecord<TSchema>,
  value: TData,
  index: number,
  data: TData[]
) => boolean | void;

/**
 * The get query options.
 */
export interface GetQueryOptions {
  /**
   * The JSON string to use.
   *
   * Defaults to an escaped JSON.stringify({@linkcode Remaq.records records}).
   */
  data?: string;
  /**
   * The table alias to use.
   * @default 'tbl'
   */
  alias?: string;
  /**
   * The selects to use.
   * @default ['*']
   */
  selects?: string[];
  /**
   * Set to `true` to use `jsonb_to_recordset` instead of `json_to_recordset`.
   * @default false
   */
  jsonb?: boolean;
}

/**
 * The get query results.
 */
export interface GetQueryResults {
  /**
   * The raw PostgreSQL select query.
   */
  raw: string;
  /**
   * The JSON string of {@linkcode Remaq.records records} (or
   * {@linkcode GetQueryOptions.data data} if provided).
   */
  json: string;
  /**
   * The columns including their data type.
   *
   * e.g. `"name" TEXT`, `"value" INT`
   */
  columns: string[];
}

/**
 * The Remaq object.
 * @template TData The type of data.
 * @template TSchema The schema type.
 */
export interface Remaq<
  TData extends { [K: keyof any]: any },
  TSchema extends Schema<TData>
> {
  /**
   * The schema object.
   */
  readonly schema: TSchema;
  /**
   * Get remapped object records.
   * @returns The mapped records.
   */
  records(): MappedRecord<TSchema>[];
  /**
   * Set a callback function that is used when creating {@linkcode MappedRecord records}.
   * @param callback A function that accepts up to four arguments and is called once per each {@linkcode MappedRecord record} created. Return `false` to exclude the {@linkcode MappedRecord record} from {@linkcode records()}.
   * @returns The {@linkcode Remaq} object.
   */
  each(callback: EachRecordCallback<TData, TSchema>): this;
  /**
   * Set the {@linkcode Schema schema} to use when formatting {@linkcode TData data}.
   * @template USchema The schema type.
   * @param schema The schema.
   * @returns A new {@linkcode Remaq} object.
   */
  using<USchema extends Schema<TData>>(schema: USchema): Remaq<TData, USchema>;
  /**
   * Use the {@linkcode records} to create a PostgreSQL select query using `json/b_to_recordset`.
   * @param options The get query options.
   * @returns The get query results.
   */
  getQuery(options?: GetQueryOptions): GetQueryResults;
}
