'use strict';

var should = require('should');
var helper = require('./../../src/helpers/general');

describe('general', function() {

  it('increment name', function test(done) {
    helper.incrementName('aaa').should.be.equal('aaa1')
    helper.incrementName('aaa1').should.be.equal('aaa2')
    helper.incrementName('aaa10').should.be.equal('aaa11')
    helper.incrementName('aaa10a').should.be.equal('aaa10a1')
    helper.incrementName('index1555').should.be.equal('index1556')
    done();
  });
});
