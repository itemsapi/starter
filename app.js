'use strict';

var itemsapi = require('itemsapi');
itemsapi.init({})

var winston = require('winston')
itemsapi.get('logger').info('it works!')

itemsapi.init({
  elasticsearch: {
    host: '127.0.0.1:9200',
    selector: 'roundRobin'
  },
  collections: {
    db: 'json',
    filename:  './collections.json'
  }
})

// standard express syntax
var express = itemsapi.get('express');
express.get('/about-us', function(req, res) {
  res.json({
    name: 'itemsapi',
    license: 'MIT'
  });
});

var nunjucks = require('nunjucks');
var nunenv = nunjucks.configure(express.get('views'), {
  autoescape: true,
  noCache: true,
  express: express
})

express.engine('html.twig', nunenv.render);
express.set('view engine', 'html.twig');
express.set('view cache', false);

express.get('/', function(req, res) {
  res.render('start', {
  });
});

itemsapi.start(function serverStart(serverInstance) {
  var host = serverInstance.address().address;
  var port = serverInstance.address().port;
  itemsapi.get('logger').info('ItemsAPI started on http://%s:%s', host, port)
});
