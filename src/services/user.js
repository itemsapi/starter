var User = require('../models/user.js');
var Promise = require('bluebird')
var emitter = require('./../../config/emitter');
var _ = require('lodash')

/**
 * todo - error handling
 */
exports.changePassword = function(data, password) {
  return new Promise(function(resolve, reject) {
    User.findOne(data, function(err, user) {
      user.setPassword(password, function(e, r) {
        user.save().then(function(r) {
          return resolve()
        })
      })
    })
  })
}

/**
 * todo - error handling
 */
exports.register = function(data) {
  return new Promise(function(resolve, reject) {
    User.register(new User({ email : data.email }), data.password, function(err, user) {
      if (err) {
        return reject(err)
      }
      return resolve(user)
    });
  })
}

/**
 * find last users
 */
exports.findLast = function(data) {
  return User.find(data)
  .sort({ created_at: -1 })
}
