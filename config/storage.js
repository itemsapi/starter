var storage = require('node-persist');
var _ = require('lodash')
var mongoose = require('./mongoose')

var LOCAL_STORAGE = __dirname + '/../localstorage';

storage.initSync({
  dir: LOCAL_STORAGE,
})

if (!storage.getItem('step')) {
  storage.setItem('step', 2)
}

storage.reset = function() {
  return new Promise(function(resolve, reject) {
    storage.clearSync()
    storage.setItem('step', 2)

    return resolve()
  })
}

storage.setConfig = function(obj) {
  return new Promise(function(resolve, reject) {
    return resolve()
  })
}

module.exports = storage
