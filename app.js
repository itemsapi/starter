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

// standard app syntax
var app = itemsapi.get('express');

var express = require('express');
app.use('/bootstrap', express.static('node_modules/bootstrap'));
app.use('/assets', express.static('assets'));

var nunjucks = require('nunjucks');
var nunenv = nunjucks.configure(app.get('views'), {
  autoescape: true,
  noCache: true,
  express: app
})

app.engine('html.twig', nunenv.render);
app.set('view engine', 'html.twig');
app.set('view cache', false);

app.get('/', function(req, res) {
  res.render('start', {});
});

itemsapi.start(function serverStart(serverInstance) {
  var host = serverInstance.address().address;
  var port = serverInstance.address().port;
  itemsapi.get('logger').info('ItemsAPI started on http://%s:%s', host, port)
});
