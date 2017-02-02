var emitter = require('../../config/emitter');
var log = require('../../config/logger');
var Promise = require('bluebird')

emitter.on('user.registration_success', function(user) {
  log.info('user "' + user.email + '" registered successfully')
})

emitter.on('user.registration_success', function(user) {
  log.info('user "' + user.email + '" called second time')
  return Promise.delay(100)
})
