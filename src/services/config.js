var _ = require('lodash')
var mongoose = require('./mongoose')

/**
 * reset config = reset app
 */
exports.reset = function() {
  return new Promise(function(resolve, reject) {
    return resolve()
  })
}

/**
 * override config with new values
 */
exports.setConfig = function(obj) {
  return new Promise(function(resolve, reject) {
    return resolve()
  })
}

/**
 * return config
 * if empty then app is not installed yet
 */
exports.getConfig = function(obj) {
  return new Promise(function(resolve, reject) {
    return resolve()
  })
}

module.exports = storage
