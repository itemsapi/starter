'use strict';

var itemsapi = require('itemsapi');
var ItemsAPI = require('itemsapi-node');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('lodash');
var bodyParser = require('body-parser');
var storage = require('node-persist');
var express = require('express');
var tcpPortUsed = require('tcp-port-used');
var config = require('./config/index').get();
var colors = require('colors')
var fs = require('fs');
var Promise = require('bluebird')
var fs = Promise.promisifyAll(require('fs-extra'))
var figlet = require('figlet');

console.log(figlet.textSync('itemsapi'))
console.log('Ideas or issues - https://github.com/itemsapi/itemsapi/issues');
console.log();

var LOCAL_STORAGE = __dirname + '/localstorage';

storage.initSync({
  dir: LOCAL_STORAGE,
});

if (!storage.getItem('step')) {
  storage.setItem('step', 2)
}

itemsapi.init({
  server: config.server,
  elasticsearch: config.elasticsearch,
  collections: {
    db: 'json',
    filename:  'collections.json'
  }
})

// standard app syntax
var app = itemsapi.get('express');
var urlHelper = require('./helpers/url');
var statusHelper = require('./helpers/status');
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
  var client = new ItemsAPI('http://localhost:' + config.server.port + '/api/v1', storage.getItem('name'));
  req.client = client;
  next();
})


var admin = require('./admin');
app.use('/admin', admin);

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

    itemsapi.get('logger').info('Open http://%s:%s in your browser to continue!'.green, host, port)
  })

}).on('error', function(err){
  console.log('Cannot start with port %s'.red, config.server.port);
  console.log('Try again with another port i.e. `PORT=4000 npm start`'.red);
  process.exit()
});
