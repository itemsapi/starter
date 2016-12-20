'use strict';

//var itemsapi = require('../itemsapi');
var itemsapi = require('itemsapi');
var ItemsAPI = require('itemsapi-node');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('lodash');
var bodyParser = require('body-parser');
var express = require('express');
var config = require('./config/index').get()
var colors = require('colors')
var figlet = require('figlet')

console.log(figlet.textSync('itemsapi'))
console.log('Ideas or issues - https://github.com/itemsapi/itemsapi/issues');
console.log();

var storage = require('./config/storage')

itemsapi.init({
  server: config.server,
  elasticsearch: config.elasticsearch,
  redis: config.redis,
  mongodb: {
    uri: config.mongodb.url
  },
  collections: {
    db: 'mongodb'
  },
  /*collections: {
    db: 'json',
    filename:  'collections.json'
  }*/
})

// standard app syntax
var app = itemsapi.get('express');
var urlHelper = require('./src/helpers/url');
var statusHelper = require('./src/helpers/status');
var nunenv = require('./nunenv')(app)

app.use('/bootstrap', express.static('node_modules/bootstrap'));
app.use('/assets', express.static('assets'));
app.use('/libs', express.static('bower_components'));

app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '5mb' }));


app.set('view engine', 'html.twig');
app.set('view cache', false);

app.engine('html.twig', nunenv.render);

/**
 * middleware route
 */
app.all('*', function(req, res, next) {

  req.is_installation = !storage.getItem('step') || storage.getItem('step') < 3

  var client = new ItemsAPI('http://localhost:' + config.server.port + '/api/v1', storage.getItem('name'));
  req.client = client;
  next();
})

var admin = require('./admin')
app.use('/admin', admin)

//require('./config/passport')(app)

/**
 * middleware route
 */
app.all('*', function(req, res, next) {
  nunenv.addGlobal('step', storage.getItem('step'));
  nunenv.addGlobal('name', storage.getItem('name'));
  req.name = storage.getItem('name')

  res.locals.logo = config.template_variables.logo
  res.locals.title = config.template_variables.title
  res.locals.image = config.template_variables.image
  res.locals.hints = config.template_variables.hints

  next();
})

require('./routes')(app)

module.exports = itemsapi
