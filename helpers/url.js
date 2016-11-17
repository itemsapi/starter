'use strict';
var _ = require('underscore');
var urijs = require('urijs');
var _ = require('underscore');

exports.build = function(str, data) {
  var url = new urijs(str || '');
  var search = url.search(true);
  url.search(_.extend(search, data));
  return url.normalizeQuery().toString();
}
