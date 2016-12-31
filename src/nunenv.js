var nunjucks = require('nunjucks');
var urlHelper = require('./helpers/url');
var _ = require('lodash')

/**
 * template engine
 */
module.exports = function(app) {

  var nunenv = new nunjucks.Environment(
    new nunjucks.FileSystemLoader('views', {
      autoescape: true,
      watch: true,
      noCache: true,
    })
  )

  nunenv.express(app)

  nunenv
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

  .addFilter('slice', function(string, a, b) {
    if (_.isString(string) || _.isArray(string)) {
      return string.slice(a, b)
    }
    return string
  })

  .addFilter('split', function(string, delimiter) {
    return string.split(delimiter || ',')
  })

  .addFilter('shuffle', function(array) {
    return _.shuffle(array)
  })

  .addFilter('join', function(array, delimiter) {
    return array.join(delimiter || ',')
  })

  .addFilter('ceil', function(str) {
    return Math.ceil(str)
  })

  .addFilter('build', function(str, data) {
    return urlHelper.build(str, data);
  })

  return nunenv
}
