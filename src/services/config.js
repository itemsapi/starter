var _ = require('lodash')
var mongoose = require('./../../config/mongoose')
var Config = require('./../models/config')

/**
 * reset config = reset app
 */
exports.resetConfig = function() {
  return Config.remove()
}

/**
 * override config with new values
 */
exports.setConfig = function(a, b) {
  var data = a
  if (_.isString(a) && _.isString(b)) {
    data = {}
    data[a] = b
  }

  return Config.findOne()
  .then(function(res) {
    if (!res) {
      var config = new Config(data)
      return config.save()
    } else {
      var config = _.assignIn(res, data)
      return config.save()
    }
  })
}

/**
 * return config
 * if empty then app is not installed yet
 */
exports.getConfig = function(obj) {
  return Config.findOne()
  .then(function(res) {
    return res || {}
  })
}
