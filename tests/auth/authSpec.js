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
      done()
    })
  })

  it('should make successfull login', function(done) {
    request(setup.server)
      .post('/admin/login')
      .send({
        username: 'admin',
        password: 'itemsapi'
      })
      .end(function afterRequest(err, res) {
        res.res.headers.location.should.eql('/admin');
        res.statusCode.should.eql(302);
        done();
      });
  });

  it('should make unsuccessfull with wrong username', function(done) {
    request(setup.server)
      .post('/admin/login')
      .send({
        username: 'wrong',
        password: 'abcdef'
      })
      .end(function afterRequest(err, res) {
        res.res.headers.location.should.eql('/admin/login');
        res.statusCode.should.eql(302);
        done();
      });
  });

  it('should make successfull login to frontend', function(done) {
    request(setup.server)
      .post('/login')
      .send({
        username: 'admin',
        password: 'itemsapi'
      })
      .end(function afterRequest(err, res) {
        res.res.headers.location.should.eql('/');
        res.statusCode.should.eql(302)
        done();
      });
  })

  it('should make unsuccessfull login to frontend', function(done) {
    request(setup.server)
      .post('/login')
      .send({
        username: 'wrong',
        password: 'abcdef'
      })
      .end(function afterRequest(err, res) {
        res.res.headers.location.should.eql('/login');
        res.statusCode.should.eql(302)
        done();
      });
  });

  it('should register user and login', function test(done) {
    service.register({
      email: 'joe@mailinator.com',
      password: 'joe'
    })
    .then(function(result) {
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
  })



});
