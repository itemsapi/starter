var emitter = require('../../config/emitter');
var log = require('../../config/logger');
var Promise = require('bluebird')

emitter.on('project.created', function(user) {
  log.info('project created successfully')
})
