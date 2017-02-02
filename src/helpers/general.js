'use strict';
var _ = require('underscore');
var urijs = require('urijs');
var _ = require('underscore');

//http://stackoverflow.com/questions/11059054/get-and-replace-the-last-number-on-a-string-with-javascript-or-jquery
exports.incrementName = function(string) {
  var output = string.replace(/\d+$/, function(s) {
    return +s+1;
  })
  return output === string ? (output + '1') : output
}
