//var storage = require('./config/storage');

var configService = require('./services/config')
var urlHelper = require('./helpers/url');
var statusHelper = require('./helpers/status');
var config = require('./../config/index').get();
var redis_client = require('./../config/redis')
var Promise = require('bluebird')
var _ = require('lodash')

/**
 * list of all routes
 */
module.exports = function(app) {

  app.get(['/', '/catalog'], function(req, res) {
    if (req.is_installation) {
      //return next()
      return res.redirect('/installation')
    } else {

      var page = parseInt(req.query.page, 10);
      var is_ajax = req.query.is_ajax || req.xhr;

      var sort = 'visits'

      var filters = JSON.parse(req.query.filters || '{}');
      var query = {
        sort: sort,
        //query: req.query.query,
        query_string: req.query.query,

        //query_string: 'enabled:true OR _missing_:enabled',
        page: page,
        aggs: req.query.filters,
        per_page: 16
      }

      return req.client.search(query)
      .then(function(result) {
        return res.render('basic/catalog', {
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
        return res.status(500).json({
          message: 'unexpected error'
        });
      })
    }
  })

  app.get(['/installation'], function(req, res) {

    if (!req.settings.is_installation) {
      return res.status(404).json({
        message: 'Not found'
      });
    }

    var url = config.elasticsearch.host

    return statusHelper.elasticsearch(url)
    .then(function(result) {
      return res.render('installation/start', result);
    })
  })

  app.get('/category/:name', function(req, res) {
    var name = req.params.name;
    req.client.aggregation(name, {
      per_page: 1000,
      sort: '_term',
      order: 'asc',
      size: 500,
      query_string: 'enabled:true OR _missing_:enabled'
    })
    .then(function(result) {
      res.render('basic/category', {
        aggregation: result,
        name: name
      })
    })
  })

  /**
   * generate sitemap for website
   */
  app.get('/sitemap.xml', function(req, res) {

    if (!req.settings.is_sitemap) {
      return res.status(404).json({
        message: 'Not found'
      })
    }

    return res.set('Content-Type', 'text/xml').render('general/sitemap', {
      url: req.base_url
    });
  })

  /**
   * generate sitemap for website items
   */
  app.get('/sitemap.item.xml', function(req, res) {

    if (!req.settings.is_sitemap) {
      return res.status(404).json({
        message: 'Not found'
      })
    }

    var query = {
      sort: 'created_at',
      query_string: 'enabled:true OR _missing_:enabled',
      per_page: 6000
    }

    req.client.search(query)
    .then(function(result) {
      return res.set('Content-Type', 'text/xml').render('general/sitemap_item', {
        items: result.data.items,
        url: req.base_url
      });
    })
  })

  app.get('/api', function(req, res) {
    res.render('api');
  })

  app.get('/item/:id', function(req, res) {

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
      return res.render('basic/item', {
        item: item,
        id: id,
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
      return configService.setConfig({
        step: 2,
        name: json.name
      })
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
    //return Promise.resolve()

    var data = {
    }

    if (req.body.json) {
      try {
        // check if we catch no error
        data.data = JSON.parse(req.body.json);
        //data.data = req.body.json
      } catch (e) {
        console.log('Your JSON is not valid. Please try again!'.red);
        console.log('You can use https://jsonformatter.curiousconcept.com/ for JSON validation'.red)
        return res.status(500).json({
          message: 'Your JSON is not valid. Please try again!'
        })
      }
    } else {
      data.url = req.body.url
    }

    return req.client.createProject(data)
    .delay(1500)
    .then(function(result) {
      return configService.setConfig({
        step: 3,
        name: result.name
      })
    })
    .then(function(result) {
      res.redirect('/installation');
    })
  });

  /**
   * filter results (SEO)
   */
  app.get('/filter/:aggregation/:name', function(req, res) {
    var page = parseInt(req.query.page, 10) || 1;
    var aggregation = req.params.aggregation;

    var query = {
      sort: 'most_votes',
      query: req.query.query || '',
      page: page,
      query_string: 'enabled:true OR _missing_:enabled',
      aggs: JSON.stringify({
        [aggregation]: [req.params.name]
      }),
      per_page: 12
    }

    var key

    if (req.name) {
      key = req.name + '_' + req.params.aggregation + '_' + req.params.name;
    }

    Promise.all([req.client.search(query), redis_client.getAsync(key)])
    .spread(function(result, filter_original_value) {
      var sortings = _.map(result.data.sortings, function(v, k) {
        return v;
      })

      var filter_value = filter_original_value

      if (filter_value) {
        filter_value = JSON.parse(filter_value)
      } else {
        filter_value = req.params.name
      }

      res.render('basic/catalog', {
        is_ajax: false,
        items: result.data.items,
        pagination: result.pagination,
        query: req.query.query,
        page: page,
        filter: {
          key: req.params.aggregation,
          val: filter_value
        },
        url: req.url,
        filter_original_value: filter_original_value,
        aggregations: result.data.aggregations,
        sortings: sortings
      })
    })
    .catch(function(err) {
      return res.status(500).json({
        error: 'error'
      });
    })
  });

}



