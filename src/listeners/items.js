var emitter = require('../../config/emitter');
var log = require('../../config/logger');
var Promise = require('bluebird')

emitter.on('item.view', function(item, user) {
  log.info('item id: "%s" and name: "%s" is previewed', item.id, item.name)
})

emitter.on('item.add', function(item, user) {
  log.info('item id: "%s" and name: "%s" is previewed', item.id, item.name)
})

emitter.on('item.view', function(item) {
  //return Promise.delay(900)
})
