var should = require('should');
var sinon = require('sinon');
var request = require('supertest');
var setup = require('./../mocks/setup');

setup.makeSuite('Authentication', function() {

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
});
