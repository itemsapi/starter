'use strict';


var _ = require('lodash')
var nconf = require('nconf')
var configHelper = require('./../src/helpers/config')
var fs = require('fs')
var isProduction = process.env.NODE_ENV === 'production';
var isDevelopment = false

if (
  process.env.NODE_ENV === 'development' ||
  !process.env.NODE_ENV
) {
  isDevelopment = true
}

var isMocha = !!_.find(process.argv, function(val) {
  return val.indexOf('mocha') !== -1;
});

var isTest = process.env.NODE_ENV === 'test' || isMocha;

var configFile = __dirname + '/local.json';

if (isTest) {
  configFile = __dirname + '/test.json';
}

nconf.use('memory');
if (fs.existsSync(configFile) !== false) {
  nconf.file('overrides', {file: configFile})
}

nconf.file('defaults', {file: __dirname + '/root.json'});

if (process.env.PORT) {
  nconf.set('server:port', process.env.PORT);
}

if (process.env.SEARCHBOX_URL) {
  nconf.set('elasticsearch:host', process.env.SEARCHBOX_URL);
} else if (process.env.ELASTICSEARCH_URL) {
  nconf.set('elasticsearch:host', process.env.ELASTICSEARCH_URL);
}

if (process.env.REDIS_URL) {
  //redis://h:p4ef2d87fd1e1eac40c08cc26d8c27413ae1afcc7a1c06d269bcad9d4fad25e74@ec2-79-125-8-9.eu-west-1.compute.amazonaws.com:17399
  var redisConfig = configHelper.parseRedisUrl(process.env.REDIS_URL)

  if (redisConfig) {
    nconf.set('redis', redisConfig)
  }

  //nconf.set('redis:host', 'ec2-79-125-8-9.eu-west-1.compute.amazonaws.com');
  //nconf.set('redis:port', '17399');
  //nconf.set('redis:auth_pass', 'p4ef2d87fd1e1eac40c08cc26d8c27413ae1afcc7a1c06d269bcad9d4fad25e74');
}

exports.get = function() {
  return nconf.get();
}
module.exports = exports;
