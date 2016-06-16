'use strict';

var itemsapi = require('itemsapi');
var winston = require('winston')
itemsapi.get('logger').info('it works!')
var ItemsAPI = require('itemsapi-node');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('lodash');
var bodyParser = require('body-parser');
var storage = require('node-persist');
var express = require('express');
var nunjucks = require('nunjucks');


var LOCAL_STORAGE = __dirname + '/localstorage';
var ELASTICSEARCH_URL = '127.0.0.1:9200';
// heroku elasticsearch addon
if (process.env.SEARCHBOX_URL) {
  ELASTICSEARCH_URL = process.env.SEARCHBOX_URL;
}

var PORT = process.env.PORT;

console.log(PORT);
console.log(ELASTICSEARCH_URL);
console.log(__dirname);

storage.initSync({
  dir: LOCAL_STORAGE,
});

if (!storage.getItem('step')) {
  storage.setItem('step', 2)
}


itemsapi.init({
  server: {
    port: PORT,
    host: "0.0.0.0",
    logger: false
  },
  elasticsearch: {
    host: ELASTICSEARCH_URL
  },
  collections: {
    db: 'json',
    filename:  'collections.json'
  }
})

// standard app syntax
var app = itemsapi.get('express');
app.use('/bootstrap', express.static('node_modules/bootstrap'));
app.use('/assets', express.static('assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var nunenv = nunjucks.configure(app.get('views'), {
  autoescape: true,
  noCache: true,
  express: app
})

app.engine('html.twig', nunenv.render);
app.set('view engine', 'html.twig');
app.set('view cache', false);


/**
 * middleware route
 */
app.all('*', function(req, res, next) {
  var client = new ItemsAPI('http://localhost:' + PORT + '/api/v1', storage.getItem('name'));
  req.client = client;
  //req.step = storage.getItem('step')
  nunenv.addGlobal('step', storage.getItem('step'));
  nunenv.addGlobal('name', storage.getItem('name'));
  console.log(storage.getItem('step'));
  next();
})

app.get('/', function(req, res) {
  if (storage.getItem('step') < 3) {
    res.render('start', {});
  } else {
    req.client.getCollections()
    .then(function(result) {
      console.log(JSON.stringify(result));
      var name = result.data.items[0].name;
      res.render('start', {});
    })
  }
});

// not necessary anymore because system create that out of the box
app.post('/add-collection', function(req, res) {
  var json = JSON.parse(req.body.collection)

  req.client.addCollection(json)
  .then(function(result) {
    return req.client.createMapping(json.name)
  })
  .then(function(result) {
    // if adding collection was successful we go into 2 step
    storage.setItem('step', 2)
    storage.setItem('name', json.name)
    res.redirect('/');
  })
  .catch(function(err) {
    res.status(500).json({});
  })
});

app.post('/add-data', function(req, res) {
  return req.client.createProject({
    url: req.body.url
  })
  .then(function(result) {
    //console.log(result);
    //var name = result.name;
    storage.setItem('step', 3)
    storage.setItem('name', result.name)
    res.redirect('/');
  })
});

itemsapi.start(function serverStart(serverInstance) {
  var host = serverInstance.address().address;
  var port = serverInstance.address().port;
  itemsapi.get('logger').info('ItemsAPI started on http://%s:%s', host, port)
});
