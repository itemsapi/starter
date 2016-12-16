var mongoose = require('mongoose');
var config = require('./index').get();
mongoose.Promise = require('bluebird');
mongoose.connect(config.mongodb.url);

module.exports = mongoose
