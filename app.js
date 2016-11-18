'use strict';

var itemsapi = require('itemsapi');
var winston = require('winston')
//itemsapi.get('logger').info('it works!')
var ItemsAPI = require('itemsapi-node');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('lodash');
var bodyParser = require('body-parser');
var storage = require('node-persist');
var express = require('express');
var nunjucks = require('nunjucks');
var tcpPortUsed = require('tcp-port-used');

var LOCAL_STORAGE = __dirname + '/localstorage';
var ELASTICSEARCH_URL = 'http://127.0.0.1:9200';
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
var urlHelper = require('./helpers/url');

app.use('/bootstrap', express.static('node_modules/bootstrap'));
app.use('/assets', express.static('assets'));
app.use('/libs', express.static('bower_components'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var nunenv = nunjucks.configure(app.get('views'), {
  autoescape: true,
  noCache: true,
  express: app
})

.addFilter('debug', function(obj) {
  return JSON.stringify(obj, null, 2)
})

.addFilter('intval', function(obj) {
  return parseInt(obj || 0, 10);
})

.addGlobal('in_array', function(element, array) {
  array = array || [];
  return array.indexOf(element) !== -1;
})

.addFilter('ceil', function(str) {
  return Math.ceil(str);
})
.addFilter('build', function(str, data) {
  return urlHelper.build(str, data);
})

app.engine('html.twig', nunenv.render);
app.set('view engine', 'html.twig');
app.set('view cache', false);


/**
 * middleware route
 */
app.all('*', function(req, res, next) {
  //req.step = storage.getItem('step')
  var client = new ItemsAPI('http://localhost:' + PORT + '/api/v1', storage.getItem('name'));
  req.client = client;
  nunenv.addGlobal('step', storage.getItem('step'));
  nunenv.addGlobal('name', storage.getItem('name'));
  req.name = storage.getItem('name')
  next();
})

app.get(['/', '/catalog'], function(req, res) {
  if (1 && storage.getItem('step') < 3) {
    res.render('start', {});
  } else {


    var page = parseInt(req.query.page, 10);
    var is_ajax = req.query.is_ajax || req.xhr;

    var sort = 'rating'

    var filters = JSON.parse(req.query.filters || '{}');
    var query = {
      sort: sort,
      query: req.query.query,
      query_string: 'enabled:true OR _missing_:enabled',
      page: page,
      aggs: req.query.filters,
      per_page: 16
    }

    req.client.search(query)
    .then(function(result) {

      res.render('catalog', {
        items: result.data.items,
        pagination: result.pagination,
        query: req.query.query,
        page: page,
        sort: sort,
        is_ajax: is_ajax,
        url: req.url,
        aggregations: result.data.aggregations,
        sortings: result.data.sortings,
        filters: filters,
        //sortings: sortings
      });
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).render('pages/error');
    })
  }
})

app.get('/category/:name', function(req, res) {
  var name = req.params.name;
  var path = 'category';
  req.client.aggregation(name, {
    per_page: 1000,
    sort: '_term',
    order: 'asc',
    size: 500,
    query_string: 'enabled:true OR _missing_:enabled'
  })
  .then(function(result) {
    res.render(path, {
      aggregation: result,
      name: name
    })
  })
})

/**
 * generate sitemap for website
 */
app.get('/sitemap.xml', function(req, res) {
  /*if (!1) {
    return res.status(404).json();
  }*/

  return res.set('Content-Type', 'text/xml').render('sitemap', {
    url: 'url'
  });
})

/**
 * generate sitemap for website items
 */
app.get('/sitemap.item.xml', function(req, res) {
  var query = {
    sort: 'created_at',
    query_string: 'enabled:true OR _missing_:enabled',
    per_page: 6000
  }

  req.client.search(query)
  .then(function(result) {
    return res.set('Content-Type', 'text/xml').render('sitemap_item', {
      items: result.data.items,
      url: 'url'
    });
  })
})



app.get('/installation', function(req, res) {
  return request.getAsync({
    url: ELASTICSEARCH_URL
  })
  .then(function(result) {
    return res.render('start', {
      elasticsearch_status: 200
    });
  })
  .catch(function(err) {
    console.log(err);
    return res.render('start', {
      elasticsearch_status: 500
    });
  })
})

app.get('/api', function(req, res) {
  res.render('api');
})

app.get('/item/:id', function(req, res) {
  var path = 'item';

  var getItemAsync;
  var item;
  var id = req.params.id

  if (true) {
    getItemAsync = req.client.getItem(req.params.id)
  } else {
    getItemAsync = req.client.getItemByKeyValue('permalink', req.params.permalink)
  }


  return getItemAsync
  .then(function(result) {
    item = result;

    if (!item || item.enabled === false) {
      return Promise.reject('Not found')
    }
  })
  .then(function(result) {
    var fields = ['tags'];
    return Promise.all([
      req.client.similar(id, {
        fields: fields,
        query_string: 'enabled:true OR _missing_:enabled'
      })
    ])
  })
  .spread(function(similar) {
    console.log(similar);
    return res.render(path, {
      item: item,
      similar: similar.data.items.slice(0, 4)
    });
  })
  .catch(function(result) {
    console.log(result);
    return res.status(404).send('Sorry cant find that!');
  })
})

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
    console.log(err);
    res.status(500).json({});
  })
});

app.post('/add-data', function(req, res) {
  return req.client.createProject({
    url: req.body.url
  })
  .delay(2500)
  .then(function(result) {
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
