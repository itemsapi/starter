var mongoose = require('mongoose')
var config = require('./index').get()
mongoose.Promise = require('bluebird')

module.exports = mongoose.createConnection(config.mongodb.uri)
