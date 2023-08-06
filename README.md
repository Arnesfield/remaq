_**Disclaimer**: This version of the package does not contain full tests and is considered to be unstable. Use at your own risk._

# remaq

[![npm](https://img.shields.io/npm/v/remaq.svg)](https://www.npmjs.com/package/remaq)
[![Node.js CI](https://github.com/Arnesfield/remaq/workflows/Node.js%20CI/badge.svg)](https://github.com/Arnesfield/remaq/actions?query=workflow%3A"Node.js+CI")

Remap data and convert to PostgreSQL select query using `json/b_to_recordset`.

## Motivation

This package is meant for personal use to write small scripts for remapping data, and also for converting the remapped data into a PostgreSQL select query.

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

Example:

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
