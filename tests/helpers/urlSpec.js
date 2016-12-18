'use strict';

var should = require('should');
var helper = require('./../../src/helpers/url');

describe('url', function() {

  it('should build new url', function test(done) {
    helper.build('/filter', {}).should.be.equal('/filter');
    helper.build('/filter', {page: 1}).should.be.equal('/filter?page=1');
    helper.build('/filter?page=2', {page: 1}).should.be.equal('/filter?page=1');
    helper.build('/filter?page=2&ok=1', {page: 1}).should.be.equal('/filter?page=1&ok=1');
    helper.build('/catalog/?filters=%7B%22tags%22%3A%5B%22fantasy%22%5D%7D', {page: 1})
      .should.be.equal('/catalog/?filters=%7B%22tags%22%3A%5B%22fantasy%22%5D%7D&page=1');

    done();
  });
});
