var emitter = require('../../config/emitter');
var log = require('../../config/logger');
var Promise = require('bluebird')
var Item = require('./../models/item')

emitter.on('item.view', function(item, user) {
  log.info('item id: "%s" and name: "%s" is previewed', item.id, item.name);
})

emitter.on('item.created', function(item, user) {
  log.info('item id: "%s" and name: "%s" was added', item.id, item.name);
})

emitter.on('item.created', function(item, user) {
  var row = new Item({
    user: user,
    item_id: item.id
  })
  return row.save()
  .then((res) => {
    log.info('item id: "%s" was also saved to mongodb', item.id);
  })
})

emitter.on('item.view', function(item) {
  //return Promise.delay(900)
})
