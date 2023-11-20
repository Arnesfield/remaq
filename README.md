# remaq

[![npm](https://img.shields.io/npm/v/remaq.svg)](https://www.npmjs.com/package/remaq)
[![Node.js CI](https://github.com/Arnesfield/remaq/workflows/Node.js%20CI/badge.svg)](https://github.com/Arnesfield/remaq/actions?query=workflow%3A"Node.js+CI")

Remap data and convert to PostgreSQL select query using `json/b_to_recordset`.

## Motivation

This package is meant for personal use to write small scripts for remapping data, and then converting the remapped data into a PostgreSQL select query.

Check out these other projects that convert to JSON:

- [convert-excel-to-json](https://www.npmjs.com/package/convert-excel-to-json)
- [papaparse](https://www.npmjs.com/package/papaparse)
- etc.

From there, you can use this package to remap and fix issues with the data.

## Installation

Install via [npm](https://www.npmjs.com/package/remaq):

```sh
npm install remaq
```

```javascript
// ES6
import remaq from 'remaq';

// CommonJS
const { remaq } = require('remaq');
```

Install using the [UMD](https://github.com/umdjs/umd) build:

```html
<script src="https://unpkg.com/remaq/lib/index.umd.js"></script>
```

UMD Minified:

```html
<script src="https://unpkg.com/remaq/lib/index.umd.min.js"></script>
```

```javascript
const remap = window.remaq(data);
```

## Usage

Pass an _object_ or an _array of objects_ to the `remaq` function. This will return a `Remaq` object.

```javascript
const remap = remaq({ name: 'John Doe' });
```

```javascript
const remap = remaq([{ name: 'John Doe' }, { name: 'Jane Doe' }]);
```

> **Tip**: For detailed typings, please see [`types.ts`](src/types.ts).

### records()

You can access the mapped records via the `records()` method.

```javascript
const remap = remaq({ name: 'John Doe' });
const records = remap.records();
console.log(records);
```

```text
[ { name: 'John Doe' } ]
```

### each(callback)

Set a callback function that is used when creating a record. You can return `false` to exclude the record from the results.

```javascript
const items = [
  { name: 'John Doe' },
  { name: 'Lorem Ipsum' },
  { name: 'Jane Doe' }
];

const remap = remaq(items).each((record, value, index, data) => {
  console.log(
    '[%s] %s, %s, %s',
    index,
    record.name,
    value.name,
    items === data
  );
  return record.name !== 'Lorem Ipsum';
});

// note that the callback only triggers when getting records after it was set
const records = remap.records();
console.log('Total records:', records.length);
```

```text
[0] John Doe, John Doe, true
[1] Lorem Ipsum, Lorem Ipsum, true
[2] Jane Doe, Jane Doe, true
Total records: 2
```

If the data passed to `remaq` is an object instead of an array, it will treat the object as index `0` of the iteration.

### using(schema)

Set the schema to use when formatting data. This will return a new `Remaq` object that follows the provided schema.

```javascript
const items = [
  { 'First Name': 'John', 'Last Name': 'Doe' },
  { 'First Name': 'Jane', 'Last Name': 'Doe' }
];

const remap = remaq(items).using({
  firstName: 'First Name',
  lastName: { from: 'Last Name' },
  someProperty: true
});

const records = remap.records();
console.log(records);
```

```text
[
  { firstName: 'John', lastName: 'Doe', someProperty: null },
  { firstName: 'Jane', lastName: 'Doe', someProperty: null }
]
```

> **Tip**: The `record` in the [`each(callback)`](#eachcallback) call will use the same schema.

The schema is an object (of any property) that maps to a property from the data.

You can assign:

- The property directly
- A boolean value (value defaults to `null`)
- A `SchemaOptions` object

#### SchemaOptions.from

Type: Any property of data (optional)

The property of data to map from.

Value in the record defaults to `null` if not provided.

```javascript
remaq({ 'First Name': 'John Doe' }).using({
  firstName: {
    from: 'First Name'
  }
});
```

#### SchemaOptions.type

Type: `string`<br />
Default: `'TEXT'`

The data type of the property. This value is used in [`getQuery(options)`](#getqueryoptions).

```javascript
remaq({ 'Total Items': 10 }).using({
  total: {
    from: 'Total Items',
    type: 'INT'
  }
});
```

#### SchemaOptions.remap

Type: `{ [K: keyof any]: any }` (optional)

Transforms data using the object.

- If the data is an array, each item is remapped using this object.
- If the remapping required is complex, prefer to remap the data manually using [`each(callback)`](#eachcallback).

```javascript
const data = [{ List: ['YEs ', 'no'] }, { List: ['Yes', 'NO', 'N/A'] }];

const remap = remaq(data).using({
  options: {
    from: 'List',
    remap: {
      'YEs ': 'Yes',
      no: 'No',
      NO: 'No'
    }
  }
});

console.log(remap.records());
```

```text
[ { options: [ 'Yes', 'No' ] }, { options: [ 'Yes', 'No', 'N/A' ] } ]
```

#### SchemaOptions.validate(value)

Type: `(value: any) => boolean` (optional)

Validate the value and throw an error if it is invalid.

Validation only occurs after the value has been [`remap`](#schemaoptionsremap)ped.

```javascript
remaq({ Total: 10 }).using({
  total: {
    from: 'Total',
    validate: value => value >= 0
  }
});
```

### schema

The schema when provided from [`using(schema)`](#usingschema) or the default schema.

Default schema is taken from the data:

```javascript
const items = [{ 'First Name': 'John' }, { 'Last Name': 'Doe' }];

const remap = remaq(items);
console.log(remap.schema);
```

```text
{ 'First Name': 'First Name', 'Last Name': 'Last Name' }
```

When schema is provided:

```javascript
const items = [{ 'First Name': 'John' }, { 'Last Name': 'Doe' }];

const schema = {
  firstName: 'First Name',
  lastName: { from: 'Last Name' }
};

const remap = remaq(items).using(schema);

console.log('Is the same reference:', schema === remap.schema);
console.log(remap.schema);
```

```text
Is the same reference: true
{ firstName: 'First Name', lastName: { from: 'Last Name' } }
```

### getQuery(options?)

Uses the records to create a PostgreSQL select query using `json/b_to_recordset`. Returns an object (`GetQueryResults` type).

```javascript
const remap = remaq(data);
const query = remap.getQuery(/* options */);
```

#### GetQueryOptions.data

Type: `string` (optional)

The JSON string to use.

Defaults to an escaped `JSON.stringify(records})`.

#### GetQueryOptions.alias

Type: `string`<br />
Default: `'tbl'`

The table alias to use.

#### GetQueryOptions.selects

Type: `string[]`<br />
Default: `['*']`

The selects to use.

#### GetQueryOptions.jsonb

Type: `boolean`<br />
Default: `false`

Set to `true` to use `jsonb_to_recordset` instead of `json_to_recordset`.

---

The `GetQueryResults` object contains the following properties:

#### GetQueryResults.raw

Type: `string`

The raw PostgreSQL select query.

#### GetQueryResults.json

Type: `string`

The JSON string of [records](#records) (or
[data](#getqueryoptionsdata) if provided).

#### GetQueryResults.columns

Type: `string[]`

The columns including their data type.

e.g. `"name" TEXT`, `"value" INT`

## Example

Here is a full example:

```javascript
import remaq from 'remaq';

const data = [
  {
    'Item ID': 'ITEM-100',
    'Total Items': 2,
    'Name of Item': "John Doe's Lorem Ipsum",
    Description: "'Lorem ipsum' dolor sit amet",
    Tags: ['Wow!', 'YEs ', 'fluffy']
  }
];

// `using()` returns a new Remaq object
const remap = remaq(data).using({
  id: 'Item ID',
  name: 'Name of Item',
  total: {
    from: 'Total Items',
    type: 'INT',
    validate: value => value >= 0
  },
  description: { from: 'Description' },
  item_tags: {
    from: 'Tags',
    type: 'tbl__tags__enum[]',
    remap: {
      'Wow!': 'good',
      'YEs ': 'yes'
    }
  },
  placeholder: true,
  empty: {
    type: 'tbl__empty__enum'
  }
});

// for each record, do something
remap.each((record, data, index, dataArray) => {
  // modify record here
  record.placeholder = `PLACEHOLDER-${index + 1}`;
  // return `false` to exclude this record from results later
});

// the same schema object passed to `using()`
const schema = remap.schema;

// get records (objects with the schema)
const records = remap.records();

// get query
const query = remap.getQuery({
  alias: 'my_table',
  selects: ['*', 'ROW_NUMBER() OVER() AS "nth"']
});

// the escaped json string
const json = query.json;

// the escaped column names with their data types
const columns = query.columns;

// the raw select query
console.log(query.raw);
```

Output:

```sql
SELECT *, ROW_NUMBER() OVER() AS "nth"
FROM json_to_recordset('[{"id":"ITEM-100","name":"John Doe''s Lorem Ipsum","total":2,"description":"''Lorem ipsum'' dolor sit amet","item_tags":["good","yes","fluffy"],"placeholder":"PLACEHOLDER-1","empty":null}]')
AS "my_table"("id" TEXT, "name" TEXT, "total" INT, "description" TEXT, "item_tags" tbl__tags__enum[], "placeholder" TEXT, "empty" tbl__empty__enum)
```

## License

Licensed under the [MIT License](LICENSE).
