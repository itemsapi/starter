var Subscriber = require('../models/subscriber.js')
var Promise = require('bluebird')
var _ = require('lodash')

/**
 * find subscribers
 */
exports.find = function(data) {
  return Subscriber.find(data).sort({created_at: -1})
}
