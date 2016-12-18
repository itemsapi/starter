'use strict';

var should = require('should');
var helper = require('./../../src/helpers/config');

describe('config', function() {

  it('should parse redis url', function test(done) {
    helper.parseRedisUrl('redis://h:pass123@url:20000')
    .should.deepEqual({
      host: 'url',
      auth_pass: 'pass123',
      port: 20000
    })
    done();
  });

  it('should handle wrong redis url', function test(done) {
    var output = helper.parseRedisUrl('aaaa')
    should(output).be.null
    done();
  });
});
