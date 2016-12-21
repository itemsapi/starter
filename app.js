'use strict';

var itemsapi = require('./server')
var app = itemsapi.get('express');
var config = require('./config/index').get();
var statusHelper = require('./src/helpers/status');
var fs = require('fs');
var Promise = require('bluebird')
Promise.config({
  warnings: false
})

var fs = Promise.promisifyAll(require('fs-extra'))
var redis_client = require('./config/redis')
var mongoose_conn = require('./config/mongoose')

var printed = false;
redis_client.on("error", function (err) {
  if (!printed) {
    itemsapi.get('logger').info('Redis is required for authentication and nice URLs..'.red)
    itemsapi.get('logger').info('Without Redis application might not work properly'.red)
    printed = true
  }
})

var mongo_error = false

mongoose_conn.on('error', err => {
  mongo_error = true
  itemsapi.get('logger').info('MongoDB is required..'.red)
  itemsapi.get('logger').info('Please run MongoDB and restart application'.red)
})

/**
 * express js listen
 */
app.listen(config.server.port, function afterListen() {
  var host = this.address().address;
  var port = this.address().port;

  if (!host || host === '::') {
    host = '127.0.0.1'
  }

  return statusHelper.elasticsearch(config.elasticsearch.host)
  .then(function(result) {
    itemsapi.get('logger').info('ItemsAPI started!'.green)

    if (result.elasticsearch_status === 200) {
      itemsapi.get('logger').info('Elasticsearch status -', 'OK'.green)
    } else {
      itemsapi.get('logger').info('Elasticsearch status -', config.elasticsearch.host.red + ' is unavailable.'.red)
      itemsapi.get('logger').info('Your application might not work properly'.red)
      itemsapi.get('logger').info('Instructions about how to run Elasticsearch - https://github.com/itemsapi/itemsapi/blob/master/ELASTICSEARCH.md'.red)
      itemsapi.get('logger').info('To start app with your custom elasticsearch url:'.red)
      itemsapi.get('logger').info('ELASTICSEARCH_URL=http://localhost:9200 npm start'.red)
    }

    if (!fs.existsSync('./bower_components')) {
      itemsapi.get('logger').info('Bower packages were not installed properly'.red)
      itemsapi.get('logger').info('Please run: '.red)
      itemsapi.get('logger').info('./node_modules/.bin/bower cache clean --allow-root && ./node_modules/.bin/bower install --allow-root'.red)
    }

    if (!mongo_error) {
      itemsapi.get('logger').info('Open http://%s:%s in your browser to continue!'.green, host, port)
    } else {
      //itemsapi.get('logger').info('Open http://%s:%s in your browser to continue!'.red)
    }

  })

}).on('error', function(err){
  console.log('Cannot start with port %s'.red, config.server.port);
  console.log('Try again with another port i.e. `PORT=4000 npm start`'.red);
  process.exit()
});
