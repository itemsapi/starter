var MyEmitter = require('eventemitter2').EventEmitter2;

var emitter = new MyEmitter({
  wildcard: true
})

module.exports = emitter
