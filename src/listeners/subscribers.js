var emitter = require('../../config/emitter');
var log = require('../../config/logger');
var Promise = require('bluebird')

emitter.on('subscriber.created', function(subscriber) {
  log.info('new subscriber: "%s"', subscriber.email)
})
