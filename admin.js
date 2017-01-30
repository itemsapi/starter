var express = require('express')
var admin = express();

var Promise = require('bluebird')
var fs = Promise.promisifyAll(require('fs'));
var bodyParser = require('body-parser')

var cookieParser = require('cookie-parser')
var moment = require('moment')
var _ = require('lodash')

admin.use('/lte/plugins', express.static('bower_components/AdminLTE/plugins'));
admin.use('/lte/bootstrap', express.static('bower_components/AdminLTE/bootstrap'));
admin.use('/lte/dist', express.static('bower_components/AdminLTE/dist'));
admin.use('/codemirror', express.static('bower_components/codemirror'));

//var mongoose = require('mongoose');
//var mongoose = require('./config/mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require('./config/index').get();
var session = require('express-session');
var urlHelper = require('./src/helpers/url');
var configService = require('./src/services/config');
var imageService = require('./src/services/image');
//var uiHelper = require('./src/helpers/ui');

var nunjucks = require('nunjucks');
var multer  = require('multer')

const UPLOAD_DEST = 'uploads/temp'
var upload = multer({ dest: UPLOAD_DEST })

var nunenv = require('./src/nunenv')(admin, 'admin/views', {
  autoescape: true,
  watch: true,
  noCache: true,
})

admin.set('view engine', 'html.twig');
admin.set('view cache', false);
admin.engine('html.twig', nunenv.render);

admin.use(bodyParser.json({
  limit: '50mb'
}));

admin.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
admin.use(cookieParser());

var RedisStore = require('connect-redis')(session);

admin.use(session({
  secret: 'itemsapi admin 159',
  saveUninitialized: false,
  store: new RedisStore({
    prefix: 'front_sess:',
    host: config.redis.host,
    port: config.redis.port,
    pass: config.redis.auth_pass
  }),
  cookie: config.cookie,
  resave: false
}))

admin.use(passport.initialize());
admin.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  done(null, id)
});

passport.use(new LocalStrategy(
  function(username, password, done) {

    if (username !== config.auth.username || password !== config.auth.password) {
      return done(null, false, { message: 'Incorrect credentials' });
    }

    return done(null, {
      username: username
    })
  }
));

admin.get('/login', function(req, res) {
  return res.render('auth/login');
});

admin.post('/login', passport.authenticate('local', {
  successRedirect: '/admin',
  failureRedirect: '/admin/login'
}));

admin.get('/logout', function(req, res) {
  req.logout();
  return res.redirect('/');
});


admin.all('*', function(req, res, next) {
  if (!req.user) {
    return res.redirect('/admin/login');
  }

  var user = req.user;
  nunenv.addGlobal('user', user);
  next();
})


/**
 * dashboard
 */
admin.get(['/', '/dashboard'], function (req, res) {
  Promise.all([req.client.search({

  })])
  .spread(function(items) {
    //console.log(items);
    return res.render('dashboard', {
      items_count: items.pagination.total
    })
  })
})

/**
 * show images list
 */
admin.get(['/images'], function (req, res) {
  Promise.all([imageService.find()])
  .spread(function(images) {
    return res.render('images/list', {
      rows: images,
      configured_images: !!config.images
    })
  })
})

/**
 * image delete
 */
admin.all(['/images/delete/:id'], function(req, res) {
  var id = req.params.id;
  imageService.delete(id)
  .then(function(result) {
    return res.redirect('/admin/images');
  })
});

/**
 * show images list
 */
admin.post(['/images/upload'], upload.single('file'), function (req, res) {

  var promise = Promise.resolve()
  var filename = req.body.url
  var temp_filename

  if (req.file) {
    temp_filename = req.file.path
    promise = imageService.upload(req.file.path)
  } else {
    promise = imageService.download(req.body.url, UPLOAD_DEST)
    .then(function(filename) {
      temp_filename = filename
      return imageService.upload(filename)
    })
  }

  promise
  .then(function(image) {
    return fs.unlinkAsync(temp_filename)
  })
  .then(function(image) {
    return res.redirect('/admin/images')
  })
  .catch(function(result) {
    return res.status(500).send('error');
  })
})

/**
 * show settings page
 */
admin.get(['/settings'], function (req, res) {
  Promise.all([])
  .spread(function() {
    return res.render('settings', {
      row: req.dynamic_config
    })
  })
})

/**
 * edit settings and redirect
 */
admin.post(['/settings'], function (req, res) {

  var default_form_values = {
    is_installation: false,
    is_sitemap: false,
    hints: false
  }

  var merge = _.chain(default_form_values)
  .merge(req.body)
  .mapValues(function(o) {
    if (o === 'on') {
      return true
    }
    return o
  })
  .value()

  //console.log(merge);

  configService.setConfig(merge)
  .then(function(result) {
    return res.redirect('/admin/settings')
  })
  .catch(function(result) {
    console.log(result);
    return res.status(500).send('error');
  })
})

/**
 * be careful - it reset current installation
 */
admin.get(['/reset'], function(req, res) {
  configService.resetConfig()
  .then(function(result) {
    return res.redirect('/installation')
  })
})

/**
 * items list
 */
admin.get('/items', function (req, res) {
  var page = parseInt(req.query.page, 10);
  var aggregation = req.params.aggregation;

  var obj = {
    sort: 'most_votes',
    per_page: 20,
    query: req.query.query,
    page: page,
    aggs: req.query.filters
  }

  if (req.query.waiting) {
    obj.query_string = 'enabled: false'
  } else {
    obj.query_string = 'enabled:true OR _missing_:enabled'
  }

  var search = req.client.search(obj);

  Promise.delay(0).then(function() {
    return [search];
  }).spread(function(result) {
    res.render('items/list', {
      items: result.data.items,
      pagination: result.pagination,
      aggregations: result.data.aggregations
    });
  })
})

/**
 * items delete
 */
admin.all(['/items/delete/:id'], function(req, res) {
  var id = req.params.id;
  req.client.deleteItem(id)
  .then(function(result) {
    return res.redirect('/admin/items');
  })
});

/**
 * enable / disable item
 */
admin.get(['/items/enable/:id'], function(req, res) {
  var id = req.params.id;
  var item
  var enabled = JSON.parse(req.query.enabled)

  req.client.getItem(id)
  .then(function(result) {
    return req.client.partialUpdateItem(id, {
      enabled: enabled
    })
  })
  .then(function(result) {
    return res.redirect('/admin/items/rawedit/' + id)
  })
  .catch(function(result) {
    console.log(result);
    return res.status(500).send('error');
  })
});

/**
 * items raw edit
 */
admin.get(['/items/rawadd'], function(req, res) {
  return res.render('items/rawadd', {
    collection: {}
  })
})

/**
 * items raw edit
 */
admin.post(['/items/rawadd'], function(req, res) {
  var id = req.params.id;
  var json = JSON.parse(req.body.row)

  json.modified_at = new Date()
  return req.client.addItem(json)
  .then(function(result) {
    return res.redirect('/admin/items/rawedit/' + result.id)
  })
})


/**
 * items raw edit
 */
admin.get(['/items/rawedit/:id'], function(req, res) {
  var id = req.params.id;
  var images


  return req.client.getItem(id)
  .then(function(result) {
    return res.render('items/rawedit', {
      id: id,
      json: JSON.stringify(result, null, 4),
      item: result,
      images: images
    })
  })
});

/**
 * items raw edit
 */
admin.post(['/items/rawedit/:id'], function(req, res) {
  var id = req.params.id;
  var json = JSON.parse(req.body.row)

  json.modified_at = new Date()
  console.log(json)

  return req.client.partialUpdateItem(id, json)
  .then(function(result) {
    return res.redirect('/admin/items/rawedit/' + id)
  })
})

/**
 * collection reindexing
 */
admin.get(['/collections/reindex'], function (req, res) {
  req.client.getCollection()
  .then(function(result) {
    var new_index = result.index + '1'
    return req.client.collectionReindex(undefined, {
      new_index: new_index,
      new_type: new_index
    })
  })
  .then(function(result) {
    res.redirect('/admin/collections/edit');
  })
})

/**
 * slugs reindexing
 */
admin.get(['/slugs/reindex'], function (req, res) {
  req.client.slugsReindex()
  .then(function(result) {
    res.redirect('/admin/collections/edit');
  })
})

/**
 * collections get edit
 */
admin.get(['/collections/edit', '/collections/edit/:id'], function (req, res) {
  if (req.params.id) {
    req.client.setName(req.params.id)
  }

  Promise.all([req.client.getCollection(), req.client.getMapping()])
  .spread(function(collection, mapping) {
    res.render('collections/edit', {
      //collection: JSON.stringify(collection, null, 4),
      collection: collection,
      aggregations: collection.aggregations,
      sortings: collection.sortings,
      //mapping: JSON.stringify(mapping, null, 4)
      mapping: mapping
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
