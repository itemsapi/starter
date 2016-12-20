'use strict';

var sinon = require('sinon')
var should = require('should');
const assert = require('assert');
var Promise = require('bluebird')
var _ = require('lodash')
var setup = require('./../mocks/setup');
var fixtures = Promise.promisifyAll(require('node-mongoose-fixtures'));
var service = require('./../../src/services/config');

setup.makeSuite('config management', function() {

  var project
  before(function before(done) {
    fixtures.resetAsync('Config')
    .then(function(result) {
      done()
    })
  })

  it('should get empty config', function test(done) {
    service.getConfig()
    .then(function(result) {
      assert.deepEqual({}, result)
      done()
    })
  })

  it('should set config', function test(done) {
    service.setConfig({
      name: 'my-app'
    })
    .then(function(result) {
      assert.equal(result.name, 'my-app')
      done()
    })
  })

  it('should override config', function test(done) {
    service.setConfig({
      name: 'my-app2'
    })
    .then(function(result) {
      assert.equal(result.name, 'my-app2')
      done()
    })
  })

  it('should override config with different interface', function test(done) {
    service.setConfig('name', 'my-app3')
    .then(function(result) {
      assert.equal(result.name, 'my-app3')
      done()
    })
  })

  it('should get config', function test(done) {
    service.getConfig()
    .then(function(result) {
      assert.equal(result.name, 'my-app3')
      done()
    })
  })

  it('should reset config', function test(done) {
    service.resetConfig()
    .then(function(result) {
      done()
    })
  })

  it('should get no config', function test(done) {
    service.getConfig()
    .then(function(result) {
      assert.equal(null, result)
      done()
    })
  })
})
