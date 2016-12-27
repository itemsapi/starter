'use strict';

var sinon = require('sinon')
var should = require('should');
const assert = require('chai').assert;
var Promise = require('bluebird')
var _ = require('lodash')
var setup = require('./../mocks/setup');
var fixtures = Promise.promisifyAll(require('node-mongoose-fixtures'));

setup.makeSuite('image upload', function() {

  var project
  var service = require('./../../src/services/image');
  var Image = require('./../../src/models/image')

  before(function before(done) {
    fixtures.resetAsync('Image')
    .then(function(result) {
      done()
    })
  })

  xit('should upload image go S3', function test(done) {
    service.uploadS3('./assets/images/logo.jpg')
    .then(function(result) {
      console.log(result);
      done()
    })
  })

  it('should upload image go S3 using adapter', function test(done) {
    service.upload('./assets/images/logo.jpg')
    .then(function(result) {
      //console.log(result);
      //assert.equal(2, result.length)
      return Image.findOne()
    })
    .then(function(result) {
      assert.isDefined(result.endpoints)
      assert.isDefined(result.thumb_url)
      assert.isDefined(result.medium_url)
      assert.equal(true, result.enabled)
      done()
    })
  })
})
