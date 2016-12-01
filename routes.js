var storage = require('node-persist');
var urlHelper = require('./helpers/url');
var statusHelper = require('./helpers/status');
var config = require('./config/index').get();

/**
 * list of all routes
 */
module.exports = function(app) {

  app.get(['/', '/catalog'], function(req, res, next) {
    if (!storage.getItem('step') || storage.getItem('step') < 3) {
      return next()
      //res.render('start', {});
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

  app.get(['/', '/installation'], function(req, res) {
    var url = config.elasticsearch.host

    return statusHelper.elasticsearch(url)
    .then(function(result) {
      return res.render('start', result);
    })
  })

  /**
   * be careful - it reset current installation
   */
  app.get(['/reset'], function(req, res) {

    storage.clearSync()
    storage.setItem('step', 2)

    return res.redirect('/')
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
    .delay(2500)
    .then(function(result) {
      storage.setItem('step', 3)
      storage.setItem('name', result.name)
      res.redirect('/');
    })
  });
}
