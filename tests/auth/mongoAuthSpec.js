var should = require('should');
var Promise = require('bluebird')
var sinon = require('sinon');
var request = require('supertest');
var setup = require('./../mocks/setup');
var fixtures = Promise.promisifyAll(require('node-mongoose-fixtures'));
var service = require('./../../src/services/user');

setup.makeSuite('Authentication', function() {

  before(function before(done) {
    fixtures.resetAsync('User')
    .then(function(result) {
      service.register({
        email: 'joe@mailinator.com',
        password: 'joe'
      })
      .then(function(result) {
        done()
      })
    })
  })

  it('should login', function test(done) {
    request(setup.server)
    .post('/login')
    .send({
      username: 'joe@mailinator.com',
      password: 'joe'
    })
    .end(function afterRequest(err, res) {
      res.res.headers.location.should.eql('/');
      res.statusCode.should.eql(302)
      done();
    });
  })

  it('should not login with not existent user', function test(done) {
    request(setup.server)
    .post('/login')
    .send({
      username: 'wrong',
      password: 'wrong'
    })
    .end(function afterRequest(err, res) {
      res.res.headers.location.should.eql('/login');
      res.statusCode.should.eql(302)
      done();
    });
  })

  it('should not login with incorrect password', function test(done) {
    request(setup.server)
    .post('/login')
    .send({
      username: 'joe@mailinator.com',
      password: 'wrong'
    })
    .end(function afterRequest(err, res) {
      res.res.headers.location.should.eql('/login');
      res.statusCode.should.eql(302)
      done();
    })
  })

});
