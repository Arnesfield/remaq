import { expect } from 'chai';
import { remaq } from '../src';

describe('remaq', () => {
  it('should be a function', () => {
    expect(remaq).to.be.a('function');
  });

  it('should return an object', () => {
    const remap = remaq({});
    expect(remap).to.be.an('object');
    expect(remap).to.have.property('schema').that.deep.equals({});
    expect(remap).to.have.property('records').which.is.a('function');
    expect(remap).to.have.property('using').which.is.a('function');
    expect(remap).to.have.property('each').which.is.a('function');
    expect(remap).to.have.property('getQuery').which.is.a('function');
  });

  // TODO: other tests
});
