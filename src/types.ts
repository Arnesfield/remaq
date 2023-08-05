export interface SchemaOptions<TFrom extends keyof any> {
  from?: TFrom;
  type?: string;
  remap?: { [K: keyof any]: any };
}

export interface Schema<TData extends { [K: keyof any]: any }> {
  [name: string]: keyof TData | SchemaOptions<keyof TData> | true;
}

export type MappedRecord<TSchema extends { [K: keyof any]: any }> = {
  [Key in keyof TSchema]: any;
};

export type EachRecordCallback<
  TData extends { [K: keyof any]: any },
  TSchema extends Schema<TData>
> = (
  record: MappedRecord<TSchema>,
  value: TData,
  index: number,
  data: TData[]
) => boolean | void;

export interface GetQueryOptions {
  data?: string;
  alias?: string;
  selects?: string[];
  jsonb?: boolean;
}

export interface GetQueryResults {
  raw: string;
  json: string;
  columns: string[];
}

export interface Remaq<
  TData extends { [K: keyof any]: any },
  TSchema extends Schema<TData>
> {
  readonly schema: TSchema;
  records(): MappedRecord<TSchema>[];
  each(callback: EachRecordCallback<TData, TSchema>): this;
  using<USchema extends Schema<TData>>(schema: USchema): Remaq<TData, USchema>;
  getQuery(options?: GetQueryOptions): GetQueryResults;
}
