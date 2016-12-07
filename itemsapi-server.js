var itemsapi = require('itemsapi');
var winston = require('winston')
var config = require('./config/index').get();

var env = process.env.NODE_ENV || 'development'

itemsapi.init({
  server: {
    port: 5000
  },
  elasticsearch: config.elasticsearch,
  allowed_methods: '*',
  tokens: ['token'],
  collections: {
    db: 'json',
    filename:  './collections.json'
  }
})

itemsapi.start(function serverStart(serverInstance) {
  var host = serverInstance.address().address;
  var port = serverInstance.address().port;
  itemsapi.get('logger').info('ItemsAPI started as separated server on http://%s:%s', host, port)
});
