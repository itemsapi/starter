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
var configService = require('./src/services/config')
var colors = require('colors')
var figlet = require('figlet')
var mongoose = require('./config/mongoose')

console.log(figlet.textSync('itemsapi'))
console.log('Ideas or issues - https://github.com/itemsapi/starter/issues');
console.log();


var storage = require('./config/storage')

itemsapi.init({
  server: config.server,
  elasticsearch: config.elasticsearch,
  redis: config.redis,
  mongodb: {
    uri: config.mongodb.uri
  },
  collections: {
    db: 'mongodb'
  },
  allowed_ips: config.allowed_ips
})

// standard app syntax
var app = itemsapi.get('express');
var urlHelper = require('./src/helpers/url');
var statusHelper = require('./src/helpers/status');
var nunenv = require('./src/nunenv')(app, 'views', {
  autoescape: true,
  watch: true,
  noCache: true
})

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

  req.is_installation = true
  req.step = 2
  req.base_url = req.protocol + '://' + req.get('host')

  return configService.getConfig()
  .timeout(2000)
  .then(function(dynamic_config) {
    req.dynamic_config = dynamic_config
    if (dynamic_config.name) {
      req.name = dynamic_config.name
      req.step = dynamic_config.step
      req.is_installation = false
      req.settings = dynamic_config
      res.locals.settings = dynamic_config
    }
    var client = new ItemsAPI('http://localhost:' + config.server.port + '/api/v1', req.name)
    req.client = client;
    //nunenv.addGlobal('step', req.step)
    //nunenv.addGlobal('name', req.name)
    res.locals.step = req.step
    res.locals.name = req.name
    return next()
  })
  .catch(function(err) {
    return res.status(500).json({
      message: 'unexpected error - probably mongodb is required'
    });
  })
})

var admin = require('./admin')
app.use('/admin', admin)

//require('./config/passport')(app)

/**
 * middleware route
 */
app.all('*', function(req, res, next) {
  //res.locals  = _.assignIn(res.locals, config.template_variables)
  res.locals.settings  = req.settings
  next();
})

require('./src/routes')(app)

module.exports = itemsapi
