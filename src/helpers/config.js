'use strict';
var _ = require('lodash');

exports.parseRedisUrl = function(url) {
  var chunks = url.split(':')
  if (chunks.length < 4) {
    return null
  }

  var chunks2 = chunks[2].split('@')
  return {
    host: chunks2[1],
    auth_pass: chunks2[0],
    port: parseInt(chunks[3], 10)
  }
}
