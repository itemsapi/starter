//var storage = require('./config/storage');

var configService = require('./services/config')
var urlHelper = require('./helpers/url');
var statusHelper = require('./helpers/status');
var config = require('./../config/index').get();
var redis_client = require('./../config/redis')
var Promise = require('bluebird')
var _ = require('lodash')
var emitter = require('./../config/emitter');
var Subscriber = require('./models/subscriber');
var slug = require('slug')

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

  /**
   * for experimenting purposes now
   */
  app.get(['/landing2'], function(req, res) {

    var filters = JSON.parse(req.query.filters || '{}');
    var query = {
      sort: 'most_votes',
      query_string: 'enabled:true OR _missing_:enabled',
      page: 1,
      per_page: 12
    }

    var recent
    var popular

    var promises = []
    var per_page = 6

    promises.push(req.client.search({
      sort: 'created_at',
      query_string: 'enabled:true OR _missing_:enabled',
      page: 1,
      per_page: per_page
    }))

    promises.push(req.client.search({
      sort: 'year',
      query_string: 'enabled:true OR _missing_:enabled',
      page: 1,
      per_page: per_page
    }))

    Promise.all(promises)
    .spread(function(recent, year, comments, history, users) {
      console.log(recent);

      res.render('basic/landing2', {
        recent_items: recent.data.items,
        items2: year.data.items,
        aggregations: recent.data.aggregations,
        url: req.url
      })
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).render('pages/error');
    })
  })

  app.get(['/installation'], function(req, res) {

    if (req.settings && !req.settings.is_installation) {
      return res.status(404).json({
        message: 'Not found'
      });
    }

    var url = config.elasticsearch.host

    return statusHelper.elasticsearch(url)
    .then(function(result) {

      result.data_url = process.env.DATA_URL || 'https://raw.githubusercontent.com/itemsapi/itemsapi-example-data/master/items/movies-processed.json';
      return res.render('installation/start', result);
    })
  })

  app.get('/category/:name', function(req, res) {
    var name = req.params.name;
    req.client.aggregation(name, {
      page: req.query.page || 1,
      per_page: req.query.per_page || 100,
      sort: '_term',
      order: 'asc',
      size: 10000,
      query_string: 'enabled:true OR _missing_:enabled'
    })
    .then(function(result) {
      /*console.log(result);*/
      res.render('basic/category', {
        aggregation: result,
        pagination: result.pagination,
        name: name
      })
    })
  })

  /**
   * generate autocomplete for main search
   */
  app.get('/autocomplete', function(req, res) {

    var term = req.query.term

    req.client.search({
      per_page: 6,
      query_string: '(enabled:true OR _missing_:enabled) AND name:/' + term + '.*/',
    })
    .then(function(result) {
      return res.json(_.map(result.data.items, function(val) {
        return {
          //value: val.permalink,
          value: val.id,
          label: val.name
        }
      }))
    })
  })


  /**
   * add item by users
   */
  app.get('/add', function(req, res) {
    res.render('basic/add')
  })

  /**
   * add item by users
   */
  app.post('/add', function(req, res) {
    console.log(req.body)

    var data = req.body
    data.enabled = !!req.settings.item_auto_enabled
    data.created_at = new Date()
    data.modified_at = new Date()

    if (data.name) {
      data.permalink = slug(data.name, {
        lower: true
      })
    }

    return req.client.addItem(data)
    .then(function(item) {
      return emitter.emitAsync('item.created', item, req.user)
    })
    .then(function(result) {
      req.flash('info', 'hello!')
      res.redirect('/add')
    })
  })

  /**
   * generate autocomplete for specific field
   */
  app.get('/field-autocomplete', function(req, res) {

    var field = req.query.field
    /*if (['tags'].indexOf(field) === -1) {
      return res.status(400).json({
      })
      }*/

    return req.client.fieldAggregation(field, {
      per_page: 5,
      aggregation_query: req.query.term,
      query_string: 'enabled:true OR _missing_:enabled'
    })
    .then(function(result) {
      return res.json(_.map(result.data.buckets, function(val) {
        return {
          id: val.key,
          label: val.key,
          value: val.key
        }
      }))
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

  /**
   * compare two or more items
   */
  app.get(['/compare/:id1/:id2', '/compare/:id1/:id2/:id3'], function(req, res) {

    var array = [
      req.client.getItem(req.params.id1),
      req.client.getItem(req.params.id2),
    ]

    if (req.params.id3) {
      array.push(req.client.getItem(req.params.id3))
    }

    return Promise.all(array)
    .spread(function(item1, item2, item3) {
      console.log(item1);
      console.log(item2);
      return res.render('basic/compare', {
        item1: item1,
        item2: item2,
        item3: item3
      })
    })
    .catch(function(result) {
      console.log(result);
      return res.status(404).send('Sorry cant find that!');
    })
  })


  /**
   * get item by id or permalink
   */
  app.get(['/id/:id', '/item/:permalink'], function(req, res) {

    var getItemAsync;
    var item;
    var id = req.params.id

    if (req.params.id) {
      getItemAsync = req.client.getItem(req.params.id)
    } else {
      getItemAsync = req.client.getItemByKeyValue('permalink', req.params.permalink)
    }

    return getItemAsync
    .then(function(result) {
      item = result;

      if (item.id) {
        id = item.id
      }

      if (!item || item.enabled === false) {
        return Promise.reject('Not found')
      }

      return emitter.emitAsync('item.view', item, req.user)
    })
    .then(function(result) {
      var fields = ['tags'];

      if (req.settings.recommendation_field) {
        fields = [req.settings.recommendation_field];
      }

      return Promise.all([
        req.client.similar(id, {
          fields: fields,
          query_string: 'enabled:true OR _missing_:enabled'
        })
      ])
    })
    .spread(function(similar) {
      console.log(similar);
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

    if (req.settings && !req.settings.is_installation) {
      return res.status(404).json({
        message: 'Not found'
      });
    }

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

    if (req.settings && !req.settings.is_installation) {
      return res.status(404).json({
        message: 'Not found'
      });
    }

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
    .then(function(item) {
      return emitter.emitAsync('project.created')
    })
    .then(function(result) {
      res.redirect('/installation');
    })
  });

  app.post('/subscribe', function(req, res) {
    var subscriber = new Subscriber({
      email: req.body.email,
      name: req.body.name,
      source: req.body.source
    })

    if (!req.body.email) {
      return res.status(400).json({})
    }

    return subscriber.save()
    .then(function(result) {
      return emitter.emitAsync('subscriber.created', result)
    })
    .then(function(result) {
      return res.json({});
    })
    .catch(function(result) {
      return res.status(400).json({})
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
