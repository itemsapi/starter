'use strict';

var itemsapi = require('itemsapi');

var winston = require('winston')
itemsapi.get('logger').info('it works!')


var ELASTICSEARCH_URL = '127.0.0.1:9200';
// heroku elasticsearch addon
if (process.env.SEARCHBOX_URL) {
  ELASTICSEARCH_URL = process.env.SEARCHBOX_URL;
}

var PORT = process.env.PORT;

console.log(PORT);
console.log(ELASTICSEARCH_URL);

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

var ItemsAPI = require('itemsapi-node');
var client = new ItemsAPI('http://localhost:' + PORT + '/api/v1', 'cities');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('lodash');


// standard app syntax
var app = itemsapi.get('express');
var bodyParser = require('body-parser');

var express = require('express');
app.use('/bootstrap', express.static('node_modules/bootstrap'));
app.use('/assets', express.static('assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
  client.getCollections()
  .then(function(result) {
    //console.log(result);
    console.log(JSON.stringify(result));

    var name = result.data.items[0].name;
    console.log(name);
    res.render('start', {});
  })
});

app.post('/add-collection', function(req, res) {
  var json = JSON.parse(req.body.collection)

  client.addCollection(json)
  .then(function(result) {
    return client.createMapping(json.name)
  })
  .then(function(result) {
    res.redirect('/');
  })
  .catch(function(err) {
    console.log(err);
    res.status(500).json({});
  })
});

app.post('/add-data', function(req, res) {
  //var json = JSON.parse(req.body.collection)

  var url = req.body.url;

  //url: 'https://raw.githubusercontent.com/itemsapi/itemsapi-example-data/master/movies.json',

  request.getAsync({
    url: url,
    json: true,
    gzip: true
  })
  .then(function(result) {
    return result.body
  })
  .then(function(items) {
    return client.deleteAllItems()
    .then(function() {
      return client.addBulkItems(items)
    })
  })
  .then(function() {
    res.redirect('/');
  })

});

itemsapi.start(function serverStart(serverInstance) {
  var host = serverInstance.address().address;
  var port = serverInstance.address().port;
  itemsapi.get('logger').info('ItemsAPI started on http://%s:%s', host, port)
});
