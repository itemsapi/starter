var express = require('express');
var admin = express();
//var itemsapi = require('./config/itemsapi');


//var ItemsAPI = require('itemsapi-node');
//var ITEMSAPI_URL = 'http://localhost:4000/api/v1';

//var config = require('./index').get();
//var Promise = require('bluebird')
//var _ = require('lodash')

//var client = new ItemsAPI(ITEMSAPI_URL, 'movies');

/*client({
  name: 'movies',
  backend: 'http://localhost:4000/api/v1'
}).search({
  query: 'test'
})*/

//var client = new ItemsAPI();

/*module.exports = function(options) {
  var itemsapi = new ItemsAPI()
  options = options || {}

  itemsapi.setParams({
    name: options.collection || options.name,
    backendUrl: options.backend || options.backendUrl || ITEMSAPI_URL
  })

  return itemsapi
}*/



var Promise = require('bluebird');
var bodyParser = require('body-parser');

var cookieParser = require('cookie-parser');
var moment = require('moment')

admin.use('/lte/plugins', express.static('bower_components/AdminLTE/plugins'));
admin.use('/lte/bootstrap', express.static('bower_components/AdminLTE/bootstrap'));
admin.use('/lte/dist', express.static('bower_components/AdminLTE/dist'));
admin.use('/codemirror', express.static('bower_components/codemirror'));

//var mongoose = require('mongoose');
//var mongoose = require('./config/mongoose');
//var passport = require('passport');
//var LocalStrategy = require('passport-local').Strategy;
//var config = require('./config/index').get();
//var session = require('express-session');
//var fixtures = require('node-mongoose-fixtures');
//var urlHelper = require('./src/helpers/url');
//var uiHelper = require('./src/helpers/ui');

var nunjucks = require('nunjucks');

var nunenv = new nunjucks.Environment(
  new nunjucks.FileSystemLoader('admin/views', {
    autoescape: true,
    watch: true,
    noCache: true,
  })
)

nunenv.express(admin)

admin.set('view engine', 'html.twig');
admin.set('view cache', false);
admin.engine('html.twig', nunenv.render);

admin.use(bodyParser.json({
  limit: '50mb'
}));

admin.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
admin.use(cookieParser());

/**
 * dashboard
 */
admin.get(['/', '/dashboard'], function (req, res) {
  return res.render('dashboard')
})

/**
 * collections get edit
 */
admin.get(['/collections/edit', '/collections/edit/:id'], function (req, res) {
  if (req.params.id) {
    req.client.setName(req.params.id)
  }

  console.log(req.client);

  Promise.all([req.client.getCollection(), req.client.getMapping()])
  .spread(function(collection, mapping) {
    res.render('collections/edit', {
      collection: JSON.stringify(collection, null, 4),
      mapping: JSON.stringify(mapping, null, 4)
    });
  })
})

/**
 * collections post edit
 */
admin.post(['/collections/edit', '/collections/edit/:id'], function (req, res) {

  if (req.params.id) {
    req.client.setName(req.params.id)
  }

  var json = JSON.parse(req.body.row)
  console.log(json);
  req.client.updateCollection(json)
  .then(function(result) {
    console.log(result);
    var url = req.params.id ?
      '/admin/collections/edit/' + req.params.id :
      '/admin/collections/edit'
    res.redirect(url);
  })
})

module.exports = admin;
