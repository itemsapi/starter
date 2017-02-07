'use strict';

var sinon = require('sinon')
var should = require('should');
var Promise = require('bluebird')
var _ = require('lodash')
var setup = require('./../mocks/setup');
var fixtures = Promise.promisifyAll(require('node-mongoose-fixtures'));
var service = require('./../../src/services/user');
var service = require('./../../src/services/user');
var sinon = require('sinon')
var User = require('./../../src/models/user');
var assert = require('assert')

setup.makeSuite('user manager', function() {

  before(function before(done) {
    fixtures.resetAsync('User')
    .then(function(result) {
      done()
    })
  })

  it('should register user', function test(done) {
    service.register({
      email: 'jan@mailinator.com',
      password: 'jan'
    })
    .then(function(user) {
      user.authenticate('jan', function(err, res) {
      assert.equal(null, err)
      res.should.have.property('is_admin', false)
      user.should.have.property('is_admin', false)
      user.should.have.property('email', 'jan@mailinator.com')
      user.should.have.property('hash')
      done()

      })


    })
  })

  it('cannot register user with same email', function test(done) {
    service.register({
      email: 'jan@mailinator.com',
      password: 'jan'
    })
    .catch(function(err) {
      done()
    })
  })

  it('cannot register user with empty password', function test(done) {
    service.register({
      email: 'jan2@mailinator.com',
      password: ''
    })
    .catch(function(err) {
      console.log(err);
      done()
    })
  })

  it('should update user with facebook data', function test(done) {
    service.updateFacebookUser('', '', {
      emails: [{
        value: 'joe@mailinator.com'
      }],
      photos: [{
        value: 'image.jpg'
      }],
      id: 12345,
      displayName: 'Joe Joe'
    })
    .then(function(result) {
      result.facebook.should.have.property('name', 'Joe Joe')
      result.facebook.should.have.property('id', 12345)
      result.should.have.property('email', 'joe@mailinator.com')
      result.should.have.property('picture', 'image.jpg')
      done()
    })
  })

  it('should register facebook user', function test(done) {
    service.updateFacebookUser('', '', {
      emails: [{
        value: 'mark@mailinator.com'
      }],
      id: 12345,
      displayName: 'Mark Zuck'
    })
    .then(function(result) {
      result.facebook.should.have.property('name', 'Mark Zuck')
      result.facebook.should.have.property('id', 12345)
      result.should.have.property('email', 'mark@mailinator.com')
      done()
    })
  })

  it('should register facebook user without email', function test(done) {
    service.updateFacebookUser('', '', {
      id: 333,
      displayName: 'No Email'
    })
    .then(function(result) {
      result.facebook.should.have.property('name', 'No Email')
      result.facebook.should.have.property('id', 333)
      done()
    })
  })


})
