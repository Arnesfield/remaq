import { expect } from 'chai';
import { remaq } from '../src';

function getData() {
  return { foo: 'Foo', bar: 'Bar' };
}

describe('remaq', () => {
  let data = getData();

  beforeEach(() => {
    data = getData();
  });

  it('should be a function', () => {
    expect(remaq).to.be.a('function');
  });

  it('should return a Remaq object', () => {
    const remap = remaq({});
    expect(remap).to.be.an('object');
    expect(remap).to.have.property('schema').that.deep.equals({});
    expect(remap).to.have.property('records').which.is.a('function');
    expect(remap).to.have.property('using').which.is.a('function');
    expect(remap).to.have.property('each').which.is.a('function');
    expect(remap).to.have.property('getQuery').which.is.a('function');
  });

  it('should accept an object', () => {
    expect(remaq(data).records()).to.be.an('array').with.lengthOf(1);
  });

  it('should accept an array of objects', () => {
    expect(remaq([data]).records())
      .to.be.an('array')
      .with.lengthOf(1);
    expect(remaq([data, data]).records())
      .to.be.an('array')
      .with.lengthOf(2);
  });

  it('should throw an error when getting records/query within each callback', () => {
    const remap = remaq(data).each(() => {
      remap.records();
    });
    expect(() => remap.records()).to.throw(Error);
    expect(() => remap.getQuery()).to.throw(Error);

    const remap2 = remaq(data).each(() => {
      remap2.getQuery();
    });
    expect(() => remap2.records()).to.throw(Error);
    expect(() => remap2.getQuery()).to.throw(Error);
  });

  describe('schema', () => {
    it('should default to have the same schema as data', () => {
      const { schema } = remaq(data);
      expect(schema).to.have.property('foo').that.equals('foo');
      expect(schema).to.have.property('bar').that.equals('bar');
    });

    it('should use the same schema as passed through using()', () => {
      const schema = { fooField: 'foo', barField: 'bar' } as const;
      const remap = remaq(data).using(schema);
      expect(remap.schema).to.equal(schema);
    });
  });

  describe('records', () => {
    it('should match default schema', () => {
      const record = remaq(data).records()[0];
      expect(record).to.have.property('foo').that.equals(data.foo);
      expect(record).to.have.property('bar').that.equals(data.bar);
    });

    it('should match custom schema', () => {
      const remap = remaq(data).using({
        fooField: 'foo',
        barField: 'bar',
        bazField: true,
        fooField2: { from: 'foo' },
        bazField2: {}
      });
      const record = remap.records()[0];
      expect(record).to.have.property('fooField').that.equals(data.foo);
      expect(record).to.have.property('barField').that.equals(data.bar);
      expect(record).to.have.property('bazField').that.equals(null);
      expect(record).to.have.property('fooField2').that.equals(data.foo);
      expect(record).to.have.property('bazField2').that.equals(null);
    });
  });

  describe('using', () => {
    it('should default to null when not mapped', () => {
      const record = remaq(data).using({ fooField: true }).records()[0];
      expect(record).to.have.property('fooField').that.equals(null);

      const record2 = remaq(data).using({ fooField: {} }).records()[0];
      expect(record2).to.have.property('fooField').that.equals(null);
    });

    it('should remap values', () => {
      const remap = remaq(data).using({
        fooField: {
          from: 'foo',
          remap: { [data.foo]: 'My Foo' }
        }
      });
      const record = remap.records()[0];
      expect(record).to.have.property('fooField').that.equals('My Foo');
    });

    it('should remap array values', () => {
      const remap = remaq({ foo: [data.foo, 'bar', 'baz'] }).using({
        fooField: {
          from: 'foo',
          remap: { [data.foo]: 'My Foo', baz: 'My Baz' }
        }
      });
      const record = remap.records()[0];
      expect(record).to.have.property('fooField').that.is.an('array');
      expect(record.fooField[0]).to.equal('My Foo');
      expect(record.fooField[1]).to.equal('bar');
      expect(record.fooField[2]).to.equal('My Baz');
    });

    it('should validate values', () => {
      let didValidate = false;
      expect(didValidate).to.be.false;
      const remap = remaq([data, { foo: 'Not Foo' }]).using({
        fooField: {
          from: 'foo',
          validate: value => {
            expect([data.foo, 'Not Foo']).to.contain(value);
            didValidate = true;
            return true;
          }
        }
      });
      expect(didValidate).to.be.false;
      remap.records();
      expect(didValidate).to.be.true;
    });

    it('should remap before validating values', () => {
      let didValidate = false;
      expect(didValidate).to.be.false;
      const remap = remaq([data, { foo: 'Not Foo' }]).using({
        fooField: {
          from: 'foo',
          remap: { [data.foo]: 'My Foo' },
          validate: value => {
            expect(['My Foo', 'Not Foo']).to.contain(value);
            didValidate = true;
            return true;
          }
        }
      });
      expect(didValidate).to.be.false;
      remap.records();
      expect(didValidate).to.be.true;
    });

    it('should throw an error when validation fails', () => {
      const remap = remaq(data).using({
        fooField: { from: 'foo', validate: () => false }
      });
      expect(() => remap.records()).to.throw(Error);
    });
  });

  describe('each', () => {
    it('should accept callback', () => {
      let didCall = false;
      expect(didCall).to.be.false;
      const remap = remaq(data).each((record, value, index, array) => {
        didCall = true;
        expect(record).to.be.an('object');
        expect(value).to.equal(data);
        expect(index).to.equal(0);
        expect(array).to.be.an('array').that.contains(data);
      });
      expect(didCall).to.be.false;
      remap.records();
      expect(didCall).to.be.true;
    });

    it('should filter records', () => {
      const remap = remaq([data, {}]).each((_, value) => value === data);
      const records = remap.records();
      expect(records).to.have.length(1);
      expect(records[0]).to.deep.equal(data);
    });

    it('should use remapped records', () => {
      let didCall = false;
      const remap = remaq({ foo: [data.foo, 'bar', 'baz'] }).using({
        fooField: {
          from: 'foo',
          remap: { [data.foo]: 'My Foo', baz: 'My Baz' }
        }
      });
      expect(didCall).to.be.false;
      remap.each(record => {
        didCall = true;
        expect(record.fooField)
          .to.be.an('array')
          .that.deep.equals(['My Foo', 'bar', 'My Baz']);
      });
      expect(didCall).to.be.false;
      remap.records();
      expect(didCall).to.be.true;
    });
  });

  describe('getQuery', () => {
    it('should return results object', () => {
      const query = remaq(data).getQuery();
      expect(query).to.have.property('raw').to.be.a('string');
      expect(query).to.have.property('json').to.be.a('string');
      expect(query).to.have.property('columns').to.be.an('array');
    });

    it('should accept selects', () => {
      const query = remaq(data).getQuery();
      expect(query.raw.startsWith('SELECT *')).to.be.true;

      const selects = ['*', '1 AS "nth"'];
      const query2 = remaq(data).getQuery({ selects });
      expect(query2.raw.startsWith('SELECT ' + selects.join(', '))).to.be.true;
    });

    it('should accept alias', () => {
      const query = remaq(data).getQuery();
      expect(query.raw).to.contain('AS "tbl"');

      const query2 = remaq(data).getQuery({ alias: 'my_table' });
      expect(query2.raw).to.contain('"my_table"');
    });

    it('should accept custom data string', () => {
      const query = remaq(data).getQuery({ data: '[ {} ]' });
      expect(query.json).to.equal("'[ {} ]'");

      const query2 = remaq(data).getQuery({
        data: `[ { "value": "'Test'" } ]`
      });
      expect(query2.json).to.equal(`'[ { "value": "''Test''" } ]'`);
    });

    it('should accept jsonb option', () => {
      expect(remaq(data).getQuery().raw).to.contain('json_to_recordset');

      const query = remaq(data).getQuery({ jsonb: false });
      expect(query.raw).to.contain('json_to_recordset');

      const query2 = remaq(data).getQuery({ jsonb: true });
      expect(query2.raw).to.contain('jsonb_to_recordset');
    });

    it('should stringify and escape json string', () => {
      const query = remaq({ foo: "'bar'" }).getQuery();
      expect(query.json).to.equal(`'[{"foo":"''bar''"}]'`);
    });

    it('should generate raw query', () => {
      const alias = 'my_table';
      const selects = ['*'];
      const query = remaq({ foo: "'bar'" }).getQuery({ alias, selects });
      const match = [
        `SELECT ${selects.join(', ')}`,
        `FROM json_to_recordset('[{"foo":"''bar''"}]')`,
        `AS "${alias}"(${query.columns.join(', ')})`
      ].join('\n');
      expect(query.raw).to.equal(match);
    });

    describe('columns', () => {
      it('should match the default schema', () => {
        const query = remaq(data).getQuery();
        const match = Object.keys(data)
          .map(key => `"${key}" TEXT`)
          .every(column => query.columns.includes(column));
        expect(match).to.be.true;
      });

      it('should match the custom schema', () => {
        const remap = remaq(data).using({ fooField: 'foo', barField: 'bar' });
        const query = remap.getQuery();
        const match = Object.keys(remap.schema)
          .map(key => `"${key}" TEXT`)
          .every(column => query.columns.includes(column));
        expect(match).to.be.true;
      });

      it('should handle custom type', () => {
        const remap = remaq(data).using({
          fooField: { from: 'foo', type: 'INT' },
          barField: 'bar',
          bazField: { type: 'TYPE' }
        });
        const query = remap.getQuery();
        const match = [
          '"fooField" INT',
          '"barField" TEXT',
          '"bazField" TYPE'
        ].every(column => query.columns.includes(column));
        expect(match).to.be.true;
      });
    });
  });
});
